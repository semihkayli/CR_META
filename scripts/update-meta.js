/**
 * Clash Royale Meta Deck Aggregator Script (v2.0)
 * 
 * Improvements over v1:
 * - Scans 1000 players (up from 40) for more accurate meta data
 * - Tracks deck slot configuration (evolution/champion/flex slots)
 * - Cumulative season data accumulation (season_accumulator.json)
 * - Pro score system with badge-based heuristic detection
 * - Rating formula combining win rate and popularity
 * - Failsafe: aborts if fewer than 20 decks are found
 * - Downloads cards_static.json from cr-api-data for elixir/rarity info
 * - Pro deck aggregation: groups same deck used by multiple pros
 * 
 * Run with: node scripts/update-meta.js
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// ENV LOADER
// ---------------------------------------------------------------------------
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const eqIdx = trimmed.indexOf("=");
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------
const API_BASE_URL = "https://proxy.royaleapi.dev/v1";
const LIMIT_PER_REGION = 200;         // Players to fetch per region leaderboard
const MIN_DECK_USE_COUNT = 8;         // Minimum games for a deck to count in meta (was 3)
const MIN_META_DECKS_FAILSAFE = 20;   // Abort if fewer decks found (data integrity)
const REQUEST_DELAY_MS = 100;         // Delay between API calls (rate limit friendly)
const META_DECKS_OUTPUT_LIMIT = 50;   // Top N meta decks to output
const PRO_DECKS_OUTPUT_LIMIT = 30;    // Top N pro decks to output

// Regional leaderboard location IDs (countries with strong CR competitive scenes)
const LEADERBOARD_REGIONS = [
  { id: "global", name: "Global" },
  { id: "57000006", name: "France" },
  { id: "57000094", name: "Finland" },
  { id: "57000056", name: "Germany" },
  { id: "57000209", name: "Turkey" },
  { id: "57000138", name: "Japan" },
  { id: "57000249", name: "USA" },
  { id: "57000035", name: "China" },
  { id: "57000024", name: "Brazil" },
  { id: "57000184", name: "Saudi Arabia" },
  { id: "57000230", name: "Spain" },
  { id: "57000109", name: "South Korea" },
  { id: "57000136", name: "Italy" },
  { id: "57000015", name: "Argentina" },
  { id: "57000149", name: "Mexico" }
];
const MIN_PRO_SCORE = 40;             // Minimum score to be classified as discovered pro
const CARDS_DATA_URL = "https://royaleapi.github.io/cr-api-data/json/cards.json";

// Rating formula weights
const WIN_RATE_WEIGHT = 0.6;
const USE_COUNT_WEIGHT = 0.4;

// Pro score point values
const PRO_SCORE_CONFIG = {
  CRL_BADGE_POINTS: 30,
  TOP_FINISH_BADGE_POINTS: 20,
  GC_WIN_POINTS: 2,
  TWENTY_WIN_POINTS: 25,
  POL_TOP10_POINTS: 50,
  POL_TOP100_POINTS: 30,
  POL_TOP1000_POINTS: 15,
  BEST_SEASON_TOP100_POINTS: 25,
  BEST_SEASON_TOP1000_POINTS: 10,
};

// Input/Output paths
const PRO_PLAYERS_PATH = path.join(__dirname, "../src/data/pro_players.json");
const OUTPUT_PATH = path.join(__dirname, "../src/data/meta_decks.json");
const ACCUMULATOR_PATH = path.join(__dirname, "../src/data/season_accumulator.json");
const CURRENT_SEASON_FILE = path.join(__dirname, "../src/data/current_season.json");
const PREVIOUS_DECKS_FILE = path.join(__dirname, "../src/data/previous_season_decks.json");
const DISCOVERED_PROS_PATH = path.join(__dirname, "../src/data/discovered_pros.json");
const CARDS_STATIC_PATH = path.join(__dirname, "../src/data/cards_static.json");

// ---------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ---------------------------------------------------------------------------
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exponential backoff fetch wrapper with retry logic.
 */
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  const apiKey = process.env.CLASH_ROYALE_API_KEY;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    ...(options.headers || {})
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.ok) return response;

      if (response.status === 429) {
        console.warn(`[Rate Limit] 429 received. Backing off for ${backoff}ms...`);
        await delay(backoff);
        backoff *= 2;
        continue;
      }

      console.error(`[API Error] HTTP ${response.status} for ${url}`);
      return null;
    } catch (err) {
      console.error(`[Network Error] ${err.message} for ${url}`);
      if (i === retries - 1) throw err;
      await delay(backoff);
      backoff *= 2;
    }
  }
  return null;
}

/**
 * Fetch without auth header (for non-CR API calls like cr-api-data).
 */
async function fetchPublic(url) {
  try {
    const response = await fetch(url);
    if (response.ok) return response;
    console.error(`[Fetch Error] HTTP ${response.status} for ${url}`);
    return null;
  } catch (err) {
    console.error(`[Fetch Error] ${err.message} for ${url}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// SEASON HELPER (mirrors src/utils/seasonHelper.ts for Node.js context)
// ---------------------------------------------------------------------------

/**
 * Calculates the start date of a Clash Royale season.
 * Seasons start on the first Monday of each month at 09:00 UTC.
 */
function getSeasonStart(year, month) {
  const firstDay = new Date(Date.UTC(year, month, 1, 9, 0, 0));
  const dayOfWeek = firstDay.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  return new Date(Date.UTC(year, month, 1 + daysUntilMonday, 9, 0, 0));
}

/**
 * Gets the current season's start/end dates and ID.
 */
function getCurrentSeasonBounds() {
  const now = new Date();
  const currentStart = getSeasonStart(now.getUTCFullYear(), now.getUTCMonth());

  if (now < currentStart) {
    const prevMonth = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
    const prevYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
    const start = getSeasonStart(prevYear, prevMonth);
    return {
      start,
      end: currentStart,
      seasonId: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`
    };
  }

  const nextMonth = now.getUTCMonth() === 11 ? 0 : now.getUTCMonth() + 1;
  const nextYear = now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  const end = getSeasonStart(nextYear, nextMonth);

  return {
    start: currentStart,
    end,
    seasonId: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  };
}

/**
 * Parses Clash Royale battle time format to a Date object.
 * Format: "20260604T120000.000Z" or "20260604T120000"
 */
function parseBattleTime(battleTime) {
  if (!battleTime) return new Date(0);
  const cleaned = battleTime.replace(/\./g, "").replace("Z", "");
  const year = parseInt(cleaned.substring(0, 4));
  const month = parseInt(cleaned.substring(4, 6)) - 1;
  const day = parseInt(cleaned.substring(6, 8));
  const hour = parseInt(cleaned.substring(9, 11)) || 0;
  const minute = parseInt(cleaned.substring(11, 13)) || 0;
  const second = parseInt(cleaned.substring(13, 15)) || 0;
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

// ---------------------------------------------------------------------------
// PRO SCORE SYSTEM
// ---------------------------------------------------------------------------

/**
 * Calculates a "pro score" for a player based on badges, achievements, and rankings.
 * Higher score = more likely to be a professional/top competitive player.
 */
function calculateProScore(profile) {
  if (!profile) return { score: 0, details: [], name: "", tag: "" };

  let score = 0;
  const details = [];

  // Badge analysis
  if (profile.badges && Array.isArray(profile.badges)) {
    // CRL badges (each CRL participation/badge = +30 points)
    const crlBadges = profile.badges.filter(b =>
      b.name && b.name.toLowerCase().startsWith("crl")
    );
    if (crlBadges.length > 0) {
      score += crlBadges.length * PRO_SCORE_CONFIG.CRL_BADGE_POINTS;
      details.push(`CRL: ${crlBadges.length} badge(s)`);
    }

    // Top Finish badges (+20 each)
    const topFinishBadges = profile.badges.filter(b =>
      b.name && (b.name === "LadderTop1000" || b.name === "LadderTournamentTop1000")
    );
    if (topFinishBadges.length > 0) {
      score += topFinishBadges.length * PRO_SCORE_CONFIG.TOP_FINISH_BADGE_POINTS;
      details.push(`Top Finish: ${topFinishBadges.length} badge(s)`);
    }

    // Grand Challenge 12 Wins badge (+2 per GC win count)
    const gcBadge = profile.badges.find(b => b.name === "Grand12Wins");
    if (gcBadge && gcBadge.progress) {
      score += gcBadge.progress * PRO_SCORE_CONFIG.GC_WIN_POINTS;
      details.push(`GC 12 Wins: ${gcBadge.progress}x`);
    }

    // 20 Win badge (+25)
    const twentyWinBadge = profile.badges.find(b =>
      b.name && (b.name === "Classic20Wins" || b.name === "Grand20Wins" || b.name === "CRL20Wins")
    );
    if (twentyWinBadge) {
      score += PRO_SCORE_CONFIG.TWENTY_WIN_POINTS;
      details.push("20 Win Achievement");
    }
  }

  // Best Path of Legend season finish
  if (profile.bestPathOfLegendSeasonResult && profile.bestPathOfLegendSeasonResult.rank) {
    const rank = profile.bestPathOfLegendSeasonResult.rank;
    if (rank <= 10) {
      score += PRO_SCORE_CONFIG.POL_TOP10_POINTS;
      details.push(`Best PoL: #${rank} (Top 10)`);
    } else if (rank <= 100) {
      score += PRO_SCORE_CONFIG.POL_TOP100_POINTS;
      details.push(`Best PoL: #${rank} (Top 100)`);
    } else if (rank <= 1000) {
      score += PRO_SCORE_CONFIG.POL_TOP1000_POINTS;
      details.push(`Best PoL: #${rank} (Top 1000)`);
    }
  }

  // Best legacy season finish
  if (profile.leagueStatistics && profile.leagueStatistics.bestSeason && profile.leagueStatistics.bestSeason.rank) {
    const rank = profile.leagueStatistics.bestSeason.rank;
    if (rank <= 100) {
      score += PRO_SCORE_CONFIG.BEST_SEASON_TOP100_POINTS;
      details.push(`Best Season: #${rank} (Top 100)`);
    } else if (rank <= 1000) {
      score += PRO_SCORE_CONFIG.BEST_SEASON_TOP1000_POINTS;
      details.push(`Best Season: #${rank} (Top 1000)`);
    }
  }

  return {
    score,
    details,
    name: profile.name || "",
    tag: profile.tag || ""
  };
}

// ---------------------------------------------------------------------------
// RATING FORMULA
// ---------------------------------------------------------------------------

/**
 * Calculates a combined rating for a deck based on win rate and popularity.
 * Rating = winRate * 0.6 + normalize(useCount) * 0.4
 */
function calculateRating(deck, allDecks) {
  if (!allDecks || allDecks.length === 0) return deck.winRate || 0;

  const useCounts = allDecks.map(d => d.useCount);
  const maxUse = Math.max(...useCounts);
  const minUse = Math.min(...useCounts);

  const normalizedUse = maxUse > minUse
    ? ((deck.useCount - minUse) / (maxUse - minUse)) * 100
    : 50;

  return parseFloat((deck.winRate * WIN_RATE_WEIGHT + normalizedUse * USE_COUNT_WEIGHT).toFixed(1));
}

// ---------------------------------------------------------------------------
// CARD ICON CACHING
// ---------------------------------------------------------------------------

async function cacheCardIcons(metaDecks, proDecks) {
  const cardsMap = new Map();

  // Collect all unique cards from meta decks
  metaDecks.forEach(deck => {
    deck.cards.forEach(card => {
      if (card.id && card.iconUrls && card.iconUrls.medium) {
        cardsMap.set(card.id, card.iconUrls.medium);
      }
    });
  });

  // Collect all unique cards from pro decks
  proDecks.forEach(deck => {
    deck.cards.forEach(card => {
      if (card.id && card.iconUrls && card.iconUrls.medium) {
        cardsMap.set(card.id, card.iconUrls.medium);
      }
    });
  });

  const cardsDir = path.join(__dirname, "../public/images/cards");
  fs.mkdirSync(cardsDir, { recursive: true });

  console.log(`[Image Cache] Found ${cardsMap.size} unique cards to check.`);

  for (const [id, url] of cardsMap.entries()) {
    const localPath = path.join(cardsDir, `${id}.png`);
    if (fs.existsSync(localPath)) {
      continue; // Already cached
    }

    console.log(`[Image Cache] Downloading card image: ${id} from ${url}`);
    try {
      await delay(100);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[Image Cache Error] Failed to download image for card ${id}: ${res.statusText}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(localPath, buffer);
      console.log(`[Image Cache Success] Card ${id} image saved locally.`);
    } catch (err) {
      console.error(`[Image Cache Error] Exception downloading card ${id}: ${err.message}`);
    }
  }
  console.log("[Image Cache] Finished card icons caching.");
}

// ---------------------------------------------------------------------------
// CARDS STATIC DATA DOWNLOADER
// ---------------------------------------------------------------------------

/**
 * Downloads card metadata (elixir cost, rarity) from RoyaleAPI cr-api-data repo.
 * Saves as src/data/cards_static.json.
 */
async function downloadCardsStaticData() {
  console.log("[Cards Data] Downloading card metadata from cr-api-data...");
  try {
    const res = await fetchPublic(CARDS_DATA_URL);
    if (!res) {
      console.warn("[Cards Data] Failed to download. Using existing data if available.");
      return;
    }

    const cards = await res.json();
    if (!Array.isArray(cards) || cards.length === 0) {
      console.warn("[Cards Data] Empty or invalid response. Skipping update.");
      return;
    }

    // Convert to ID-keyed map for fast lookup
    const cardsMap = {};
    cards.forEach(card => {
      if (card.id) {
        cardsMap[card.id] = {
          name: card.name || "",
          elixirCost: card.elixirCost || card.elixir || 0,
          rarity: card.rarity || "Common",
          maxLevel: card.maxLevel || 14,
          maxEvolutionLevel: card.maxEvolutionLevel || 0,
          iconUrls: card.iconUrls || {}
        };
      }
    });

    const outputData = {
      updatedAt: new Date().toISOString(),
      totalCards: Object.keys(cardsMap).length,
      cards: cardsMap
    };

    fs.mkdirSync(path.dirname(CARDS_STATIC_PATH), { recursive: true });
    fs.writeFileSync(CARDS_STATIC_PATH, JSON.stringify(outputData, null, 2), "utf8");
    console.log(`[Cards Data] Saved ${outputData.totalCards} cards to cards_static.json.`);
  } catch (err) {
    console.error(`[Cards Data Error] ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// ACCUMULATOR MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Loads the season accumulator or creates a new one.
 */
function loadAccumulator(seasonId) {
  if (fs.existsSync(ACCUMULATOR_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(ACCUMULATOR_PATH, "utf8"));
      // If same season, return existing accumulator
      if (data.seasonId === seasonId) {
        console.log(`[Accumulator] Loaded existing accumulator for season ${seasonId} with ${Object.keys(data.decks || {}).length} decks.`);
        return data;
      }
      console.log(`[Accumulator] Season changed from ${data.seasonId} to ${seasonId}. Starting fresh.`);
    } catch (err) {
      console.error(`[Accumulator Error] Failed to read: ${err.message}`);
    }
  }

  // Create new accumulator
  return {
    seasonId,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    totalBattlesAnalyzed: 0,
    totalPlayersScanned: 0,
    decks: {}
  };
}

/**
 * Merges daily deck data into the season accumulator.
 */
function mergeIntoAccumulator(accumulator, dailyDecksMap) {
  for (const [deckId, dailyStats] of dailyDecksMap.entries()) {
    if (!accumulator.decks[deckId]) {
      // New deck entry
      accumulator.decks[deckId] = {
        cards: dailyStats.cards,
        useCount: 0,
        winCount: 0,
        slotConfigs: {},
        proUsage: {}
      };
    }

    const accDeck = accumulator.decks[deckId];
    accDeck.useCount += dailyStats.useCount;
    accDeck.winCount += dailyStats.winCount;

    // Merge slot configurations
    for (const [configKey, count] of dailyStats.slotConfigs.entries()) {
      accDeck.slotConfigs[configKey] = (accDeck.slotConfigs[configKey] || 0) + count;
    }

    // Merge pro usage
    for (const [proTag, proStat] of dailyStats.prosPlayed.entries()) {
      if (!accDeck.proUsage[proTag]) {
        accDeck.proUsage[proTag] = { name: proStat.name, wins: 0, games: 0 };
      }
      accDeck.proUsage[proTag].wins += proStat.wins;
      accDeck.proUsage[proTag].games += proStat.games;
    }
  }

  accumulator.lastUpdatedAt = new Date().toISOString();
}

/**
 * Saves the accumulator to disk.
 */
function saveAccumulator(accumulator) {
  fs.mkdirSync(path.dirname(ACCUMULATOR_PATH), { recursive: true });
  fs.writeFileSync(ACCUMULATOR_PATH, JSON.stringify(accumulator, null, 2), "utf8");
  console.log(`[Accumulator] Saved. Total decks tracked: ${Object.keys(accumulator.decks).length}`);
}

// ---------------------------------------------------------------------------
// SLOT CONFIGURATION HELPER
// ---------------------------------------------------------------------------

/**
 * Extracts the best (most common) slot configuration for a deck.
 * Slots: [0] = Evolution, [1] = Champion, [2] = Flex (evo or champion)
 */
function getBestSlotConfig(slotConfigs) {
  const entries = Object.entries(slotConfigs);
  if (entries.length === 0) return null;

  // Find the most frequently used slot configuration
  entries.sort((a, b) => b[1] - a[1]);
  const [bestConfigKey] = entries[0];
  const [evoId, championId, flexId] = bestConfigKey.split("|").map(Number);

  // Determine flex slot type based on card ID:
  // If the flex card ID is the same as evo (unlikely) or is a regular card → "evolution"
  // We'll use a heuristic: if we can detect it from battle data, we use that
  // For now, default to "evolution" unless it's a known champion ID range
  let flexSlotType = null;
  if (flexId && flexId > 0) {
    // Champion cards typically have IDs in the 26000085+ or specific ranges
    // This will be refined as we validate with real data
    flexSlotType = "evolution"; // Default assumption; can be overridden
  }

  return {
    evoSlotCardId: evoId || 0,
    championSlotCardId: championId || 0,
    flexSlotCardId: flexId || null,
    flexSlotType
  };
}

// ---------------------------------------------------------------------------
// MOCK DATA (Failsafe fallback when API Key is missing)
// ---------------------------------------------------------------------------

const MOCK_META_DECKS = {
  updatedAt: new Date().toISOString(),
  seasonId: getCurrentSeasonBounds().seasonId,
  totalBattlesAnalyzed: 0,
  totalPlayersScanned: 0,
  metaDecks: [
    {
      deckId: "26000000;26000002;26000003;26000042;26000087;26000093;28000011;28000034",
      cards: [
        { name: "Knight", id: 26000000, evolutionLevel: 1, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/knight.png" } },
        { name: "Goblins", id: 26000002, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/goblins.png" } },
        { name: "Giant", id: 26000003, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/giant.png" } },
        { name: "Electro Wizard", id: 26000042, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/electrowizard.png" } },
        { name: "Phoenix", id: 26000087, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/phoenix.png" } },
        { name: "Little Prince", id: 26000093, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/littleprince.png" } },
        { name: "The Log", id: 28000011, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/thelog.png" } },
        { name: "Void", id: 28000034, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/void.png" } }
      ],
      slotConfig: { evoSlotCardId: 26000000, championSlotCardId: 26000093, flexSlotCardId: null, flexSlotType: null },
      winRate: 58.6,
      useCount: 142,
      winCount: 83,
      rating: 55.2
    },
    {
      deckId: "26000010;26000015;26000021;26000032;28000000;28000008;28000015;28000016",
      cards: [
        { name: "Skeletons", id: 26000010, evolutionLevel: 1, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/skeletons.png" } },
        { name: "Ice Golem", id: 26000015, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/icegolem.png" } },
        { name: "Hog Rider", id: 26000021, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/hogrider.png" } },
        { name: "Musketeer", id: 26000032, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/musketeer.png" } },
        { name: "Fireball", id: 28000000, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/fireball.png" } },
        { name: "Zap", id: 28000008, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/zap.png" } },
        { name: "Cannon", id: 28000015, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/cannon.png" } },
        { name: "Ice Spirit", id: 28000016, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/icespirit.png" } }
      ],
      slotConfig: { evoSlotCardId: 26000010, championSlotCardId: 26000021, flexSlotCardId: null, flexSlotType: null },
      winRate: 54.2,
      useCount: 98,
      winCount: 53,
      rating: 48.5
    },
    {
      deckId: "26000000;26000004;26000011;26000027;26000030;28000000;28000011;28000012",
      cards: [
        { name: "Knight", id: 26000000, evolutionLevel: 1, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/knight.png" } },
        { name: "P.E.K.K.A", id: 26000004, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/pekka.png" } },
        { name: "Goblin Gang", id: 26000011, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/goblingang.png" } },
        { name: "Battle Ram", id: 26000027, evolutionLevel: 1, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/battleram.png" } },
        { name: "Bandit", id: 26000030, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/bandit.png" } },
        { name: "Fireball", id: 28000000, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/fireball.png" } },
        { name: "The Log", id: 28000011, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/thelog.png" } },
        { name: "Poison", id: 28000012, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/poison.png" } }
      ],
      slotConfig: { evoSlotCardId: 26000000, championSlotCardId: 26000030, flexSlotCardId: 26000027, flexSlotType: "evolution" },
      winRate: 57.1,
      useCount: 84,
      winCount: 48,
      rating: 50.3
    }
  ],
  proDecks: [
    {
      deckId: "26000000;26000002;26000003;26000042;26000087;26000093;28000011;28000034",
      cards: [
        { name: "Knight", id: 26000000, evolutionLevel: 1, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/knight.png" } },
        { name: "Goblins", id: 26000002, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/goblins.png" } },
        { name: "Giant", id: 26000003, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/giant.png" } },
        { name: "Electro Wizard", id: 26000042, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/electrowizard.png" } },
        { name: "Phoenix", id: 26000087, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/phoenix.png" } },
        { name: "Little Prince", id: 26000093, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/littleprince.png" } },
        { name: "The Log", id: 28000011, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/thelog.png" } },
        { name: "Void", id: 28000034, iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/void.png" } }
      ],
      slotConfig: { evoSlotCardId: 26000000, championSlotCardId: 26000093, flexSlotCardId: null, flexSlotType: null },
      totalUseCount: 12,
      totalWinCount: 10,
      overallWinRate: 83.3,
      proCount: 1,
      pros: [
        { tag: "#P90G2PY8", name: "Mohamed Light", useCount: 12, winCount: 10, winRate: 83.3 }
      ]
    }
  ]
};

// ---------------------------------------------------------------------------
// MAIN PIPELINE
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.CLASH_ROYALE_API_KEY;

  // Step 0: Download cards static data (elixir, rarity info)
  await downloadCardsStaticData();

  // =========================================================================
  // FAILSAFE MODE: No API Key
  // =========================================================================
  if (!apiKey || apiKey.trim() === "") {
    console.warn("[Failsafe Warning] CLASH_ROYALE_API_KEY environment variable is not defined!");
    console.log("[Failsafe Mode] Writing static MOCK meta decks database...");

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(MOCK_META_DECKS, null, 2), "utf8");
    console.log("[Failsafe Success] Mock meta decks database generated successfully!");

    // Write mock previous season decks
    if (!fs.existsSync(PREVIOUS_DECKS_FILE)) {
      const mockPrevDecks = {
        ...MOCK_META_DECKS,
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        metaDecks: MOCK_META_DECKS.metaDecks.map(deck => ({
          ...deck,
          winRate: parseFloat((deck.winRate - 1.5).toFixed(1))
        }))
      };
      fs.writeFileSync(PREVIOUS_DECKS_FILE, JSON.stringify(mockPrevDecks, null, 2), "utf8");
      console.log("[Failsafe Success] Mock previous season decks generated.");
    }

    // Write mock current season info
    const seasonBounds = getCurrentSeasonBounds();
    if (!fs.existsSync(CURRENT_SEASON_FILE)) {
      fs.writeFileSync(CURRENT_SEASON_FILE, JSON.stringify({
        id: seasonBounds.seasonId,
        startDate: seasonBounds.start.toISOString(),
        endDate: seasonBounds.end.toISOString(),
        updatedAt: new Date().toISOString()
      }, null, 2), "utf8");
    }

    console.log("[Failsafe Mode] Caching mock card icons locally...");
    await cacheCardIcons(MOCK_META_DECKS.metaDecks, MOCK_META_DECKS.proDecks);
    return;
  }

  // =========================================================================
  // REAL MODE: API Key is present
  // =========================================================================

  console.log("[Pipeline] Starting Clash Royale Meta Deck Aggregator v2.0...");

  // -----------------------------------------------------------------
  // Step 1: Season management
  // -----------------------------------------------------------------
  const seasonBounds = getCurrentSeasonBounds();
  console.log(`[Pipeline] Calculated season: ${seasonBounds.seasonId} (${seasonBounds.start.toISOString()} → ${seasonBounds.end.toISOString()})`);

  // Check for season transition
  let savedSeason = {};
  if (fs.existsSync(CURRENT_SEASON_FILE)) {
    try {
      savedSeason = JSON.parse(fs.readFileSync(CURRENT_SEASON_FILE, "utf8"));
    } catch (err) {
      console.error(`[Pipeline Error] Failed to read current_season.json: ${err.message}`);
    }
  }

  if (savedSeason.id && savedSeason.id !== seasonBounds.seasonId) {
    console.log(`[Pipeline Season Transition] Season changed from ${savedSeason.id} to ${seasonBounds.seasonId}!`);

    // Archive current accumulator as previous season data
    if (fs.existsSync(ACCUMULATOR_PATH)) {
      try {
        const oldAccumulator = JSON.parse(fs.readFileSync(ACCUMULATOR_PATH, "utf8"));
        // Build previous season decks from accumulator
        const prevSeasonData = buildOutputFromAccumulator(oldAccumulator);
        fs.writeFileSync(PREVIOUS_DECKS_FILE, JSON.stringify(prevSeasonData, null, 2), "utf8");
        console.log(`[Pipeline Season Transition] Previous season data archived to ${PREVIOUS_DECKS_FILE}`);
      } catch (err) {
        console.error(`[Pipeline Error] Failed to archive previous season: ${err.message}`);
        // Fallback: copy current meta_decks.json
        if (fs.existsSync(OUTPUT_PATH)) {
          fs.copyFileSync(OUTPUT_PATH, PREVIOUS_DECKS_FILE);
          console.log("[Pipeline Season Transition] Fallback: Copied current meta_decks.json as previous season.");
        }
      }
    } else if (fs.existsSync(OUTPUT_PATH)) {
      fs.copyFileSync(OUTPUT_PATH, PREVIOUS_DECKS_FILE);
      console.log("[Pipeline Season Transition] Copied current meta_decks.json as previous season.");
    }
  }

  // Save current season info
  fs.mkdirSync(path.dirname(CURRENT_SEASON_FILE), { recursive: true });
  fs.writeFileSync(CURRENT_SEASON_FILE, JSON.stringify({
    id: seasonBounds.seasonId,
    startDate: seasonBounds.start.toISOString(),
    endDate: seasonBounds.end.toISOString(),
    updatedAt: new Date().toISOString()
  }, null, 2), "utf8");

  // -----------------------------------------------------------------
  // Step 2: Load pro players list
  // -----------------------------------------------------------------
  let proPlayers = [];
  try {
    if (fs.existsSync(PRO_PLAYERS_PATH)) {
      proPlayers = JSON.parse(fs.readFileSync(PRO_PLAYERS_PATH, "utf8"));
      console.log(`[Pipeline] Loaded ${proPlayers.length} pro players from pro_players.json.`);
    }
  } catch (err) {
    console.error(`[Pipeline Error] Failed to read pro_players.json: ${err.message}`);
  }

  // Build pro tag sets (ONLY from pro_players.json, NOT from leaderboard)
  const proTagsSet = new Set();
  const proPlayerLookup = new Map();

  proPlayers.forEach(p => {
    const cleanTag = p.tag.replace("#", "");
    proTagsSet.add(cleanTag);
    proPlayerLookup.set(cleanTag, p.name);
  });

  // -----------------------------------------------------------------
  // Step 3: Fetch leaderboard player tags (multi-region strategy)
  // -----------------------------------------------------------------
  let playerTags = [];
  console.log(`[Pipeline] Fetching top players from ${LEADERBOARD_REGIONS.length} regional leaderboards...`);

  for (const region of LEADERBOARD_REGIONS) {
    try {
      const url = `${API_BASE_URL}/locations/${region.id}/rankings/players?limit=${LIMIT_PER_REGION}`;
      await delay(REQUEST_DELAY_MS);
      const res = await fetchWithRetry(url, { method: "GET" });
      if (res) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          const tags = data.items.map(item => item.tag);
          playerTags.push(...tags);
          console.log(`[Pipeline] ${region.name}: ${tags.length} players fetched.`);
        } else {
          console.log(`[Pipeline] ${region.name}: 0 players (empty leaderboard).`);
        }
      }
    } catch (err) {
      console.warn(`[Pipeline Warning] ${region.name} leaderboard failed: ${err.message}`);
    }
  }

  // Deduplicate player tags from all regions
  playerTags = [...new Set(playerTags)];
  console.log(`[Pipeline] Total unique leaderboard players: ${playerTags.length}`);

  // Fallback: If all leaderboards are empty, fetch top clans members
  if (playerTags.length < 100) {
    console.log("[Pipeline Fallback] Few leaderboard players found. Supplementing with top clan members...");
    try {
      const clansUrl = `${API_BASE_URL}/locations/global/rankings/clans?limit=10`;
      const clansRes = await fetchWithRetry(clansUrl, { method: "GET" });
      if (clansRes) {
        const clansData = await clansRes.json();
        if (clansData.items) {
          for (const clan of clansData.items.slice(0, 5)) {
            console.log(`[Pipeline Fallback] Fetching members for clan ${clan.name}...`);
            const cleanClanTag = clan.tag.replace("#", "%23");
            const membersUrl = `${API_BASE_URL}/clans/${cleanClanTag}/members`;
            await delay(REQUEST_DELAY_MS);
            const membersRes = await fetchWithRetry(membersUrl, { method: "GET" });
            if (membersRes) {
              const membersData = await membersRes.json();
              if (membersData.items) {
                playerTags.push(...membersData.items.map(m => m.tag));
                console.log(`[Pipeline Fallback] Added ${membersData.items.length} players from ${clan.name}.`);
              }
            }
          }
          playerTags = [...new Set(playerTags)];
          console.log(`[Pipeline Fallback] Total unique players after clans: ${playerTags.length}`);
        }
      }
    } catch (err) {
      console.error(`[Pipeline Fallback Error] ${err.message}`);
    }
  }

  // Merge pro player tags into target list (ensure unique)
  const allTargetTags = [...new Set([
    ...proPlayers.map(p => p.tag),
    ...playerTags
  ])].map(tag => tag.replace("#", ""));

  console.log(`[Pipeline] Will scan ${allTargetTags.length} unique players (${proPlayers.length} pro + ${playerTags.length} leaderboard).`);

  // -----------------------------------------------------------------
  // Step 4: Scan player profiles & battlelogs
  // -----------------------------------------------------------------
  const dailyDecksMap = new Map(); // deckId → { cards, useCount, winCount, slotConfigs, prosPlayed }
  const discoveredPros = [];       // Players with high pro scores
  let totalBattlesAnalyzed = 0;

  for (let i = 0; i < allTargetTags.length; i++) {
    const tag = allTargetTags[i];

    // Progress logging every 100 players
    if (i % 100 === 0 || i === allTargetTags.length - 1) {
      console.log(`[Pipeline] Progress: ${i + 1}/${allTargetTags.length} players scanned...`);
    }

    // Check if this player is a known pro
    const proName = proPlayerLookup.get(tag);
    const isPro = proTagsSet.has(tag);

    // Fetch battlelog only (no profile fetch — saves 50% API calls)
    const battlelogUrl = `${API_BASE_URL}/players/%23${tag}/battlelog`;
    await delay(REQUEST_DELAY_MS);

    const battlelogRes = await fetchWithRetry(battlelogUrl, { method: "GET" });
    if (!battlelogRes) continue;

    const battles = await battlelogRes.json();
    if (!Array.isArray(battles)) continue;

    // Process each battle
    for (const battle of battles) {
      // Filter: only ranked (Path of Legend) matches
      if (battle.type !== "pathOfLegend") {
        continue;
      }

      const team = battle.team && battle.team[0];
      if (!team || !team.cards || team.cards.length !== 8) continue;

      // Extract cards (PRESERVE ORDER for slot tracking)
      const orderedCards = team.cards.map(c => ({
        name: c.name,
        id: c.id,
        evolutionLevel: c.evolutionLevel || 0,
        iconUrls: { medium: (c.iconUrls && c.iconUrls.medium) || "" }
      }));

      // Create deck signature (order-independent for same-deck matching)
      const sortedIds = [...orderedCards.map(c => c.id)].sort((a, b) => a - b);
      const deckId = sortedIds.join(";");

      // Track slot configuration (first 3 positions matter)
      // Slot 0 = Evolution, Slot 1 = Champion, Slot 2 = Flex (evo/champion)
      const slotConfigKey = `${orderedCards[0].id}|${orderedCards[1].id}|${orderedCards[2].id}`;

      // Determine win/loss
      const crownsEarned = team.crowns !== undefined ? team.crowns : (team.crownsEarned || 0);
      const crownsOpponent = (battle.opponent && battle.opponent[0])
        ? (battle.opponent[0].crowns !== undefined ? battle.opponent[0].crowns : (battle.opponent[0].crownsEarned || 0))
        : 0;
      const isWin = crownsEarned > crownsOpponent;

      totalBattlesAnalyzed++;

      // Update daily decks map
      if (!dailyDecksMap.has(deckId)) {
        dailyDecksMap.set(deckId, {
          deckId,
          cards: orderedCards, // Store cards in original order (first occurrence)
          useCount: 0,
          winCount: 0,
          slotConfigs: new Map(),   // configKey → count
          prosPlayed: new Map()     // proTag → { name, wins, games }
        });
      }

      const deckStats = dailyDecksMap.get(deckId);
      deckStats.useCount += 1;
      if (isWin) deckStats.winCount += 1;

      // Track slot configuration frequency
      deckStats.slotConfigs.set(slotConfigKey,
        (deckStats.slotConfigs.get(slotConfigKey) || 0) + 1
      );

      // If played by a known pro, log their match
      if (isPro) {
        if (!deckStats.prosPlayed.has(tag)) {
          deckStats.prosPlayed.set(tag, { name: proName, wins: 0, games: 0 });
        }
        const proStat = deckStats.prosPlayed.get(tag);
        proStat.games += 1;
        if (isWin) proStat.wins += 1;
      }
    }
  }

  console.log(`[Pipeline] Daily scan complete. ${totalBattlesAnalyzed} battles analyzed, ${dailyDecksMap.size} distinct deck signatures found.`);

  // -----------------------------------------------------------------
  // Step 5: Merge into cumulative season accumulator
  // -----------------------------------------------------------------
  const accumulator = loadAccumulator(seasonBounds.seasonId);
  accumulator.totalBattlesAnalyzed += totalBattlesAnalyzed;
  accumulator.totalPlayersScanned += allTargetTags.length;
  mergeIntoAccumulator(accumulator, dailyDecksMap);
  saveAccumulator(accumulator);

  // -----------------------------------------------------------------
  // Step 6: Build output from accumulator
  // -----------------------------------------------------------------
  const outputData = buildOutputFromAccumulator(accumulator);

  // Failsafe check
  if (outputData.metaDecks.length < MIN_META_DECKS_FAILSAFE) {
    console.error(`[Failsafe] Only ${outputData.metaDecks.length} meta decks found (minimum: ${MIN_META_DECKS_FAILSAFE}). Aborting to prevent data loss.`);
    console.log("[Failsafe] Existing meta_decks.json has been preserved.");
    // Still save discovered pros (they are additive, not destructive)
    saveDiscoveredPros(discoveredPros);
    process.exit(0);
  }

  // Save output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), "utf8");
  console.log(`[Pipeline Success] Saved ${outputData.metaDecks.length} meta decks and ${outputData.proDecks.length} pro decks.`);

  // -----------------------------------------------------------------
  // Step 7: Discovered pros (skipped — no profile fetching in v2.1)
  // -----------------------------------------------------------------
  // Pro discovery via profile badges is disabled to save API calls.
  // Pro players are managed manually via pro_players.json.
  // To re-enable, uncomment profile fetching in Step 4.
  console.log(`[Pro Discovery] Skipped (profile fetching disabled). Pro list managed via pro_players.json (${proPlayers.length} players).`);

  // -----------------------------------------------------------------
  // Step 8: Cache card icons locally
  // -----------------------------------------------------------------
  console.log("[Pipeline] Starting card icons local caching...");
  await cacheCardIcons(outputData.metaDecks, outputData.proDecks);
}

// ---------------------------------------------------------------------------
// BUILD OUTPUT FROM ACCUMULATOR
// ---------------------------------------------------------------------------

/**
 * Converts the cumulative accumulator data into the final meta_decks.json format.
 */
function buildOutputFromAccumulator(accumulator) {
  const metaDecks = [];
  const proDecksGrouped = new Map(); // deckId → aggregated pro deck

  for (const [deckId, deckData] of Object.entries(accumulator.decks)) {
    const winRate = parseFloat(((deckData.winCount / deckData.useCount) * 100).toFixed(1));

    // Determine best slot configuration
    const slotConfig = getBestSlotConfig(deckData.slotConfigs || {});

    // General meta selection (needs minimum use count)
    if (deckData.useCount >= MIN_DECK_USE_COUNT) {
      metaDecks.push({
        deckId,
        cards: deckData.cards,
        slotConfig,
        winRate,
        useCount: deckData.useCount,
        winCount: deckData.winCount,
        rating: 0 // Will be calculated after all decks are collected
      });
    }

    // Pro decks aggregation (group by deck, show which pros use it)
    const proUsage = deckData.proUsage || {};
    const proEntries = Object.entries(proUsage);
    if (proEntries.length > 0) {
      const pros = proEntries.map(([proTag, proStat]) => ({
        tag: `#${proTag}`,
        name: proStat.name,
        useCount: proStat.games,
        winCount: proStat.wins,
        winRate: parseFloat(((proStat.wins / proStat.games) * 100).toFixed(1))
      }));

      const totalUseCount = pros.reduce((s, p) => s + p.useCount, 0);
      const totalWinCount = pros.reduce((s, p) => s + p.winCount, 0);

      proDecksGrouped.set(deckId, {
        deckId,
        cards: deckData.cards,
        slotConfig,
        totalUseCount,
        totalWinCount,
        overallWinRate: parseFloat(((totalWinCount / totalUseCount) * 100).toFixed(1)),
        proCount: pros.length,
        pros: pros.sort((a, b) => b.useCount - a.useCount) // Sort pros by usage
      });
    }
  }

  // Calculate ratings for meta decks
  metaDecks.forEach(deck => {
    deck.rating = calculateRating(deck, metaDecks);
  });

  // Sort meta decks by rating (combined win rate + popularity)
  metaDecks.sort((a, b) => b.rating - a.rating);

  // Sort pro decks by proCount (most popular among pros), then by overall win rate
  const proDecks = [...proDecksGrouped.values()]
    .sort((a, b) => b.proCount - a.proCount || b.overallWinRate - a.overallWinRate);

  return {
    updatedAt: new Date().toISOString(),
    seasonId: accumulator.seasonId,
    totalBattlesAnalyzed: accumulator.totalBattlesAnalyzed,
    totalPlayersScanned: accumulator.totalPlayersScanned,
    metaDecks: metaDecks.slice(0, META_DECKS_OUTPUT_LIMIT),
    proDecks: proDecks.slice(0, PRO_DECKS_OUTPUT_LIMIT)
  };
}

// ---------------------------------------------------------------------------
// DISCOVERED PROS PERSISTENCE
// ---------------------------------------------------------------------------

/**
 * Saves newly discovered pro-score players, merging with existing list.
 */
function saveDiscoveredPros(newDiscoveries) {
  if (newDiscoveries.length === 0) {
    console.log("[Pro Discovery] No new pro-score players discovered this run.");
    return;
  }

  let existingPros = [];
  if (fs.existsSync(DISCOVERED_PROS_PATH)) {
    try {
      existingPros = JSON.parse(fs.readFileSync(DISCOVERED_PROS_PATH, "utf8"));
    } catch (err) {
      console.error(`[Pro Discovery Error] Failed to read existing file: ${err.message}`);
    }
  }

  // Merge: update existing entries or add new ones
  const proMap = new Map();
  existingPros.forEach(p => proMap.set(p.tag, p));

  newDiscoveries.forEach(p => {
    const existing = proMap.get(p.tag);
    if (!existing || p.proScore > existing.proScore) {
      // Update with higher score or new entry
      proMap.set(p.tag, p);
    }
  });

  // Sort by proScore descending
  const merged = [...proMap.values()].sort((a, b) => b.proScore - a.proScore);

  fs.mkdirSync(path.dirname(DISCOVERED_PROS_PATH), { recursive: true });
  fs.writeFileSync(DISCOVERED_PROS_PATH, JSON.stringify(merged, null, 2), "utf8");
  console.log(`[Pro Discovery] Saved ${merged.length} discovered pros (${newDiscoveries.length} new/updated this run).`);
}

// ---------------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------------

main().catch(err => {
  console.error("[Fatal Error] Data Pipeline failed:", err);
  process.exit(1);
});
