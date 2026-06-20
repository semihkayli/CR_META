/**
 * Clash Royale Meta Deck Aggregator Script (v3.0)
 * 
 * Improvements over v2.1:
 * - CRITICAL FIX: Corrected all region location IDs (14 out of 15 were wrong!)
 * - Expanded from 15 to 27 regions (26 countries + Global)
 * - Timezone-aware rotation: each run scans regions at their peak hours
 * - Battlelog deduplication via lastScannedTime per player
 * - Compressed accumulator format (no iconUrls, ~80% smaller)
 * - Card enrichment from cards_static.json at output time
 * - Pro player currentDeck fetching (profile API for pros only)
 * - Removed clan fallback (unnecessary with 27 regions)
 * - Low-usage deck pruning to keep accumulator clean
 * - Robust ranked battle detection (handles API format variations)
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
const MIN_DECK_USE_COUNT = 8;         // Minimum games for a deck to count in meta
const MIN_META_DECKS_FAILSAFE = 20;   // Abort if fewer decks found (data integrity)
const REQUEST_DELAY_MS = 100;         // Delay between API calls (rate limit friendly)
const META_DECKS_OUTPUT_LIMIT = 50;   // Top N meta decks to output
const PRO_DECKS_OUTPUT_LIMIT = 30;    // Top N pro decks to output
const ACCUMULATOR_VERSION = 3;        // Bump to reset accumulator on format change
const PRUNE_MIN_USE_COUNT = 2;        // Decks with fewer uses get pruned

// Rating formula weights
const WIN_RATE_WEIGHT = 0.6;
const USE_COUNT_WEIGHT = 0.4;

// Cards static data URL
const CARDS_DATA_URL = "https://royaleapi.github.io/cr-api-data/json/cards.json";

// ---------------------------------------------------------------------------
// REGION DEFINITIONS (Verified from cr-api-data/json/regions.json)
// ---------------------------------------------------------------------------
const ALL_REGIONS = [
  // Global
  { id: "global", name: "Global", group: "global" },
  // East Asia (UTC+8/+9 — peak 08-15 UTC)
  { id: "57000122", name: "Japan", group: "east_asia" },
  { id: "57000216", name: "South Korea", group: "east_asia" },
  { id: "57000056", name: "China", group: "east_asia" },
  { id: "57000185", name: "Philippines", group: "east_asia" },
  // South/SE Asia (UTC+5:30/+7 — peak 10-18 UTC)
  { id: "57000113", name: "India", group: "south_asia" },
  { id: "57000114", name: "Indonesia", group: "south_asia" },
  { id: "57000231", name: "Thailand", group: "south_asia" },
  // Middle East (UTC+2/+3 — peak 14-21 UTC)
  { id: "57000204", name: "Saudi Arabia", group: "middle_east" },
  { id: "57000077", name: "Egypt", group: "middle_east" },
  { id: "57000239", name: "Turkey", group: "middle_east" },
  // Europe (UTC+0/+1/+2/+3 — peak 14-22 UTC)
  { id: "57000087", name: "France", group: "europe" },
  { id: "57000094", name: "Germany", group: "europe" },
  { id: "57000120", name: "Italy", group: "europe" },
  { id: "57000218", name: "Spain", group: "europe" },
  { id: "57000086", name: "Finland", group: "europe" },
  { id: "57000248", name: "United Kingdom", group: "europe" },
  { id: "57000176", name: "Norway", group: "europe" },
  { id: "57000187", name: "Poland", group: "europe" },
  // South America (UTC-3/-5/-6 — peak 20-05 UTC)
  { id: "57000038", name: "Brazil", group: "south_america" },
  { id: "57000017", name: "Argentina", group: "south_america" },
  { id: "57000153", name: "Mexico", group: "south_america" },
  { id: "57000059", name: "Colombia", group: "south_america" },
  { id: "57000184", name: "Peru", group: "south_america" },
  // North America (UTC-5/-8 — peak 22-07 UTC)
  { id: "57000249", name: "United States", group: "north_america" },
  { id: "57000047", name: "Canada", group: "north_america" },
  // Oceania (UTC+10 — peak 07-13 UTC)
  { id: "57000021", name: "Australia", group: "oceania" },
];

// ---------------------------------------------------------------------------
// TIMEZONE-BASED ROTATION SCHEDULE
// Each UTC hour maps to region groups whose players are most active at that time.
// Cron runs at 0, 3, 6, 9, 12, 15, 18, 21 UTC (every 3 hours).
// ---------------------------------------------------------------------------
const ROTATION_SCHEDULE = {
  0:  ["south_america", "europe"],                             // SA peak, EU late night
  3:  ["south_america", "north_america"],                      // SA+NA peak/late
  6:  ["north_america", "global"],                             // NA late, Global
  9:  ["east_asia", "oceania"],                                // EA mid-peak, AU
  12: ["east_asia", "south_asia", "oceania"],                  // EA post-peak, SA+AU
  15: ["south_asia", "middle_east"],                           // SE Asia + ME peak start
  18: ["middle_east", "europe", "global"],                     // ME+EU peak
  21: ["europe", "global"],                                    // EU peak
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
// RANKED BATTLE DETECTION
// ---------------------------------------------------------------------------

/**
 * Determines if a battle is a ranked (Path of Legends) match.
 * Handles multiple API response formats (proxy vs official).
 */
function isRankedBattle(battle) {
  if (!battle) return false;

  // Method 1: Direct type check (RoyaleAPI proxy may use this)
  if (battle.type === "pathOfLegend") return true;

  // Method 2: gameMode name check (official API standard)
  if (battle.gameMode) {
    const modeName = (battle.gameMode.name || "").toLowerCase().replace(/[_\s]/g, "");
    if (modeName.includes("pathoflegend")) return true;
    // Known ranked gameMode IDs
    if (battle.gameMode.id === 72000200) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// REGION ROTATION
// ---------------------------------------------------------------------------

/**
 * Returns the list of regions to scan for the current run,
 * based on the UTC hour and the rotation schedule.
 * Falls back to all regions if SCAN_ALL_REGIONS is set or hour is unmatched.
 */
function getRegionsForCurrentRun() {
  if (process.env.SCAN_ALL_REGIONS === "true") {
    console.log("[Rotation] SCAN_ALL_REGIONS=true → scanning all 27 regions.");
    return ALL_REGIONS;
  }

  const hour = new Date().getUTCHours();
  // Snap to nearest 3-hour slot
  const slot = Math.floor(hour / 3) * 3;
  const targetGroups = ROTATION_SCHEDULE[slot];

  if (!targetGroups) {
    console.log(`[Rotation] No schedule for UTC hour ${hour}. Scanning all regions.`);
    return ALL_REGIONS;
  }

  const regions = ALL_REGIONS.filter(r => targetGroups.includes(r.group));
  const groupNames = targetGroups.join(", ");
  console.log(`[Rotation] UTC ${String(hour).padStart(2, "0")}:00 → groups: [${groupNames}] → ${regions.length} regions.`);
  return regions;
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
// CARD ENRICHMENT (Compressed → Full)
// ---------------------------------------------------------------------------

/**
 * Loads cards_static.json and returns a lookup map.
 */
function loadCardsStaticMap() {
  if (!fs.existsSync(CARDS_STATIC_PATH)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(CARDS_STATIC_PATH, "utf8"));
    return data.cards || {};
  } catch (err) {
    console.error(`[Cards Static] Failed to load: ${err.message}`);
    return {};
  }
}

/**
 * Enriches a compressed card { id, evo } into a full card object
 * using cards_static.json data.
 */
function enrichCard(compressedCard, cardsStaticMap) {
  const staticData = cardsStaticMap[compressedCard.id];
  return {
    name: staticData ? staticData.name : `Card_${compressedCard.id}`,
    id: compressedCard.id,
    evolutionLevel: compressedCard.evo || 0,
    iconUrls: (staticData && staticData.iconUrls) ? staticData.iconUrls : { medium: "" }
  };
}

/**
 * Enriches an array of compressed cards into full card objects.
 */
function enrichCards(compressedCards, cardsStaticMap) {
  return compressedCards.map(c => enrichCard(c, cardsStaticMap));
}

// ---------------------------------------------------------------------------
// ACCUMULATOR MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Loads the season accumulator or creates a new one.
 * Resets if season changed or accumulator version mismatches.
 */
function loadAccumulator(seasonId) {
  if (fs.existsSync(ACCUMULATOR_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(ACCUMULATOR_PATH, "utf8"));

      // Version check — reset on format change
      if (data.version !== ACCUMULATOR_VERSION) {
        console.log(`[Accumulator] Version mismatch (file: ${data.version || "none"}, expected: ${ACCUMULATOR_VERSION}). Resetting.`);
        console.log("[Accumulator] Old data was collected with incorrect region IDs — reset is intentional.");
        return createFreshAccumulator(seasonId);
      }

      // Season check
      if (data.seasonId === seasonId) {
        const deckCount = Object.keys(data.decks || {}).length;
        const playerCount = Object.keys(data.playerLastScan || {}).length;
        console.log(`[Accumulator] Loaded for season ${seasonId}: ${deckCount} decks, ${playerCount} tracked players.`);
        return data;
      }

      console.log(`[Accumulator] Season changed from ${data.seasonId} to ${seasonId}. Starting fresh.`);
    } catch (err) {
      console.error(`[Accumulator Error] Failed to read: ${err.message}`);
    }
  }

  return createFreshAccumulator(seasonId);
}

/**
 * Creates a fresh accumulator structure.
 */
function createFreshAccumulator(seasonId) {
  return {
    version: ACCUMULATOR_VERSION,
    seasonId,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    totalBattlesAnalyzed: 0,
    totalPlayersScanned: 0,
    totalRunCount: 0,
    playerLastScan: {},   // playerTag → last battleTime string (deduplication)
    decks: {}
  };
}

/**
 * Merges daily deck data into the season accumulator.
 * Cards are stored in compressed format: { id, evo }.
 */
function mergeIntoAccumulator(accumulator, dailyDecksMap) {
  for (const [deckId, dailyStats] of dailyDecksMap.entries()) {
    if (!accumulator.decks[deckId]) {
      // New deck entry — store compressed cards
      accumulator.decks[deckId] = {
        cards: dailyStats.cards, // Already compressed: [{ id, evo }, ...]
        useCount: 0,
        winCount: 0,
        slotConfigs: {},
        proUsage: {}
      };
    }

    const accDeck = accumulator.decks[deckId];
    accDeck.useCount += dailyStats.useCount;
    accDeck.winCount += dailyStats.winCount;

    // Update cards to latest observed version (may have new evo levels)
    accDeck.cards = dailyStats.cards;

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
  accumulator.totalRunCount = (accumulator.totalRunCount || 0) + 1;
}

/**
 * Prunes low-usage decks from the accumulator to prevent unbounded growth.
 * Only prunes decks with useCount < PRUNE_MIN_USE_COUNT after sufficient data collection.
 */
function pruneAccumulator(accumulator) {
  // Only prune after at least 3 runs to avoid premature cleanup
  if ((accumulator.totalRunCount || 0) < 3) return;

  const deckIds = Object.keys(accumulator.decks);
  const before = deckIds.length;
  let pruned = 0;

  for (const deckId of deckIds) {
    if (accumulator.decks[deckId].useCount < PRUNE_MIN_USE_COUNT) {
      delete accumulator.decks[deckId];
      pruned++;
    }
  }

  if (pruned > 0) {
    console.log(`[Pruning] Removed ${pruned} low-usage decks (useCount < ${PRUNE_MIN_USE_COUNT}). ${before - pruned} remaining.`);
  }
}

/**
 * Saves the accumulator to disk.
 */
function saveAccumulator(accumulator) {
  fs.mkdirSync(path.dirname(ACCUMULATOR_PATH), { recursive: true });
  fs.writeFileSync(ACCUMULATOR_PATH, JSON.stringify(accumulator, null, 2), "utf8");
  const sizeKB = (Buffer.byteLength(JSON.stringify(accumulator)) / 1024).toFixed(1);
  console.log(`[Accumulator] Saved. ${Object.keys(accumulator.decks).length} decks tracked. Size: ${sizeKB} KB.`);
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

  let flexSlotType = null;
  if (flexId && flexId > 0) {
    flexSlotType = "evolution"; // Default assumption
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

function getMockMetaDecks() {
  return {
    updatedAt: new Date().toISOString(),
    seasonId: getCurrentSeasonBounds().seasonId,
    totalBattlesAnalyzed: 0,
    totalPlayersScanned: 0,
    metaDecks: [
      {
        deckId: "26000000;26000002;26000003;26000042;26000087;26000093;28000011;28000034",
        cards: [
          { name: "Knight", id: 26000000, evolutionLevel: 1, iconUrls: { medium: "" } },
          { name: "Goblins", id: 26000002, evolutionLevel: 0, iconUrls: { medium: "" } },
          { name: "Giant", id: 26000003, evolutionLevel: 0, iconUrls: { medium: "" } },
          { name: "Electro Wizard", id: 26000042, evolutionLevel: 0, iconUrls: { medium: "" } },
          { name: "Phoenix", id: 26000087, evolutionLevel: 0, iconUrls: { medium: "" } },
          { name: "Little Prince", id: 26000093, evolutionLevel: 0, iconUrls: { medium: "" } },
          { name: "The Log", id: 28000011, evolutionLevel: 0, iconUrls: { medium: "" } },
          { name: "Void", id: 28000034, evolutionLevel: 0, iconUrls: { medium: "" } }
        ],
        slotConfig: { evoSlotCardId: 26000000, championSlotCardId: 26000093, flexSlotCardId: null, flexSlotType: null },
        winRate: 58.6,
        useCount: 142,
        winCount: 83,
        rating: 55.2
      }
    ],
    proDecks: [],
    proCurrentDecks: []
  };
}

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

    const mockData = getMockMetaDecks();
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mockData, null, 2), "utf8");
    console.log("[Failsafe Success] Mock meta decks database generated successfully!");

    // Write mock previous season decks if not exists
    if (!fs.existsSync(PREVIOUS_DECKS_FILE)) {
      fs.writeFileSync(PREVIOUS_DECKS_FILE, JSON.stringify(mockData, null, 2), "utf8");
    }

    // Write current season info if not exists
    const seasonBounds = getCurrentSeasonBounds();
    if (!fs.existsSync(CURRENT_SEASON_FILE)) {
      fs.writeFileSync(CURRENT_SEASON_FILE, JSON.stringify({
        id: seasonBounds.seasonId,
        startDate: seasonBounds.start.toISOString(),
        endDate: seasonBounds.end.toISOString(),
        updatedAt: new Date().toISOString()
      }, null, 2), "utf8");
    }

    await cacheCardIcons(mockData.metaDecks, mockData.proDecks);
    return;
  }

  // =========================================================================
  // REAL MODE: API Key is present
  // =========================================================================

  console.log("[Pipeline] Starting Clash Royale Meta Deck Aggregator v3.0...");

  // -----------------------------------------------------------------
  // Step 1: Season management
  // -----------------------------------------------------------------
  const seasonBounds = getCurrentSeasonBounds();
  console.log(`[Pipeline] Season: ${seasonBounds.seasonId} (${seasonBounds.start.toISOString()} → ${seasonBounds.end.toISOString()})`);

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
        const prevSeasonData = buildOutputFromAccumulator(oldAccumulator);
        fs.writeFileSync(PREVIOUS_DECKS_FILE, JSON.stringify(prevSeasonData, null, 2), "utf8");
        console.log(`[Pipeline Season Transition] Previous season data archived.`);
      } catch (err) {
        console.error(`[Pipeline Error] Failed to archive previous season: ${err.message}`);
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

  // Build pro tag sets
  const proTagsSet = new Set();
  const proPlayerLookup = new Map();
  proPlayers.forEach(p => {
    const cleanTag = p.tag.replace("#", "");
    proTagsSet.add(cleanTag);
    proPlayerLookup.set(cleanTag, p.name);
  });

  // -----------------------------------------------------------------
  // Step 3: Fetch leaderboard player tags (timezone-based rotation)
  // -----------------------------------------------------------------
  const regionsToScan = getRegionsForCurrentRun();
  let playerTags = [];
  console.log(`[Pipeline] Fetching top players from ${regionsToScan.length} regions...`);

  for (const region of regionsToScan) {
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

  // Merge pro player tags into target list (ensure unique)
  const allTargetTags = [...new Set([
    ...proPlayers.map(p => p.tag),
    ...playerTags
  ])].map(tag => tag.replace("#", ""));

  console.log(`[Pipeline] Will scan ${allTargetTags.length} unique players (${proPlayers.length} pro + ${playerTags.length} leaderboard).`);

  // -----------------------------------------------------------------
  // Step 4: Load accumulator (with deduplication state)
  // -----------------------------------------------------------------
  const accumulator = loadAccumulator(seasonBounds.seasonId);

  // -----------------------------------------------------------------
  // Step 5: Scan battlelogs with deduplication
  // -----------------------------------------------------------------
  const dailyDecksMap = new Map(); // deckId → { cards, useCount, winCount, slotConfigs, prosPlayed }
  let totalNewBattles = 0;
  let totalSkippedDuplicates = 0;

  for (let i = 0; i < allTargetTags.length; i++) {
    const tag = allTargetTags[i];

    // Progress logging every 100 players
    if (i % 100 === 0 || i === allTargetTags.length - 1) {
      console.log(`[Pipeline] Progress: ${i + 1}/${allTargetTags.length} players scanned...`);
    }

    // Check if this player is a known pro
    const proName = proPlayerLookup.get(tag);
    const isPro = proTagsSet.has(tag);

    // Fetch battlelog
    const battlelogUrl = `${API_BASE_URL}/players/%23${tag}/battlelog`;
    await delay(REQUEST_DELAY_MS);

    const battlelogRes = await fetchWithRetry(battlelogUrl, { method: "GET" });
    if (!battlelogRes) continue;

    const battles = await battlelogRes.json();
    if (!Array.isArray(battles)) continue;

    // Deduplication: get last scanned battle time for this player
    const lastScanTime = accumulator.playerLastScan[tag] || null;
    let newestBattleTime = lastScanTime;

    // Process each battle
    for (const battle of battles) {
      // Filter: only ranked matches
      if (!isRankedBattle(battle)) {
        continue;
      }

      // Deduplication: skip battles we've already counted
      const battleTime = battle.battleTime || battle.utcTime || "";
      if (lastScanTime && battleTime <= lastScanTime) {
        totalSkippedDuplicates++;
        continue;
      }

      // Track newest battle time for this player
      if (!newestBattleTime || battleTime > newestBattleTime) {
        newestBattleTime = battleTime;
      }

      const team = battle.team && battle.team[0];
      if (!team || !team.cards || team.cards.length !== 8) continue;

      // Extract cards in COMPRESSED format (id + evo only)
      const orderedCards = team.cards.map(c => ({
        id: c.id,
        evo: c.evolutionLevel || 0
      }));

      // Create deck signature (order-independent for same-deck matching)
      const sortedIds = [...orderedCards.map(c => c.id)].sort((a, b) => a - b);
      const deckId = sortedIds.join(";");

      // Track slot configuration (first 3 positions matter)
      const slotConfigKey = `${orderedCards[0].id}|${orderedCards[1].id}|${orderedCards[2].id}`;

      // Determine win/loss
      const crownsEarned = team.crowns !== undefined ? team.crowns : (team.crownsEarned || 0);
      const crownsOpponent = (battle.opponent && battle.opponent[0])
        ? (battle.opponent[0].crowns !== undefined ? battle.opponent[0].crowns : (battle.opponent[0].crownsEarned || 0))
        : 0;
      const isWin = crownsEarned > crownsOpponent;

      totalNewBattles++;

      // Update daily decks map
      if (!dailyDecksMap.has(deckId)) {
        dailyDecksMap.set(deckId, {
          deckId,
          cards: orderedCards, // Compressed format: [{ id, evo }, ...]
          useCount: 0,
          winCount: 0,
          slotConfigs: new Map(),
          prosPlayed: new Map()
        });
      }

      const deckStats = dailyDecksMap.get(deckId);
      deckStats.useCount += 1;
      if (isWin) deckStats.winCount += 1;

      // Update cards to latest version seen (may have newer evo levels)
      deckStats.cards = orderedCards;

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

    // Update last scanned battle time for this player
    if (newestBattleTime) {
      accumulator.playerLastScan[tag] = newestBattleTime;
    }
  }

  console.log(`[Pipeline] Scan complete. ${totalNewBattles} NEW battles analyzed, ${totalSkippedDuplicates} duplicates skipped, ${dailyDecksMap.size} distinct deck signatures found.`);

  // -----------------------------------------------------------------
  // Step 6: Merge into cumulative season accumulator
  // -----------------------------------------------------------------
  accumulator.totalBattlesAnalyzed += totalNewBattles;
  accumulator.totalPlayersScanned += allTargetTags.length;
  mergeIntoAccumulator(accumulator, dailyDecksMap);

  // Prune low-usage decks to keep accumulator lean
  pruneAccumulator(accumulator);

  // Save accumulator
  saveAccumulator(accumulator);

  // -----------------------------------------------------------------
  // Step 7: Build output from accumulator
  // -----------------------------------------------------------------
  const outputData = buildOutputFromAccumulator(accumulator);

  // Failsafe check
  if (outputData.metaDecks.length < MIN_META_DECKS_FAILSAFE) {
    console.error(`[Failsafe] Only ${outputData.metaDecks.length} meta decks found (minimum: ${MIN_META_DECKS_FAILSAFE}). Aborting to prevent data loss.`);
    console.log("[Failsafe] Existing meta_decks.json has been preserved.");
    process.exit(0);
  }

  // -----------------------------------------------------------------
  // Step 8: Fetch pro player current decks (profile API — pros only)
  // -----------------------------------------------------------------
  const proCurrentDecks = [];
  if (proPlayers.length > 0) {
    console.log(`[Pro Profiles] Fetching current decks for ${proPlayers.length} pro players...`);
    for (const pro of proPlayers) {
      const cleanTag = pro.tag.replace("#", "");
      const profileUrl = `${API_BASE_URL}/players/%23${cleanTag}`;
      await delay(REQUEST_DELAY_MS);

      try {
        const profileRes = await fetchWithRetry(profileUrl, { method: "GET" });
        if (!profileRes) continue;

        const profile = await profileRes.json();
        if (profile && profile.currentDeck && profile.currentDeck.length === 8) {
          proCurrentDecks.push({
            tag: `#${cleanTag}`,
            name: pro.name,
            updatedAt: new Date().toISOString(),
            deck: profile.currentDeck.map(c => ({
              name: c.name || "",
              id: c.id,
              evolutionLevel: c.evolutionLevel || 0,
              iconUrls: (c.iconUrls) ? { medium: c.iconUrls.medium || "" } : { medium: "" }
            }))
          });
          console.log(`[Pro Profiles] ${pro.name}: current deck captured.`);
        }
      } catch (err) {
        console.warn(`[Pro Profiles] Failed for ${pro.name}: ${err.message}`);
      }
    }
    console.log(`[Pro Profiles] Captured ${proCurrentDecks.length}/${proPlayers.length} pro current decks.`);
  }

  // Add pro current decks to output
  outputData.proCurrentDecks = proCurrentDecks;

  // Save output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), "utf8");
  console.log(`[Pipeline Success] Saved ${outputData.metaDecks.length} meta decks, ${outputData.proDecks.length} pro decks, ${proCurrentDecks.length} pro current decks.`);

  // -----------------------------------------------------------------
  // Step 9: Cache card icons locally
  // -----------------------------------------------------------------
  console.log("[Pipeline] Starting card icons local caching...");
  await cacheCardIcons(outputData.metaDecks, outputData.proDecks);
}

// ---------------------------------------------------------------------------
// BUILD OUTPUT FROM ACCUMULATOR
// ---------------------------------------------------------------------------

/**
 * Converts the cumulative accumulator data into the final meta_decks.json format.
 * Enriches compressed cards with name/iconUrls from cards_static.json.
 */
function buildOutputFromAccumulator(accumulator) {
  const cardsStaticMap = loadCardsStaticMap();
  const metaDecks = [];
  const proDecksGrouped = new Map();

  for (const [deckId, deckData] of Object.entries(accumulator.decks)) {
    const winRate = parseFloat(((deckData.winCount / deckData.useCount) * 100).toFixed(1));

    // Determine best slot configuration
    const slotConfig = getBestSlotConfig(deckData.slotConfigs || {});

    // Enrich compressed cards to full format
    const enrichedCards = enrichCards(deckData.cards || [], cardsStaticMap);

    // General meta selection (needs minimum use count)
    if (deckData.useCount >= MIN_DECK_USE_COUNT) {
      metaDecks.push({
        deckId,
        cards: enrichedCards,
        slotConfig,
        winRate,
        useCount: deckData.useCount,
        winCount: deckData.winCount,
        rating: 0 // Will be calculated after all decks are collected
      });
    }

    // Pro decks aggregation
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
        cards: enrichedCards,
        slotConfig,
        totalUseCount,
        totalWinCount,
        overallWinRate: parseFloat(((totalWinCount / totalUseCount) * 100).toFixed(1)),
        proCount: pros.length,
        pros: pros.sort((a, b) => b.useCount - a.useCount)
      });
    }
  }

  // Calculate ratings for meta decks
  metaDecks.forEach(deck => {
    deck.rating = calculateRating(deck, metaDecks);
  });

  // Sort meta decks by rating
  metaDecks.sort((a, b) => b.rating - a.rating);

  // Sort pro decks by proCount, then by overall win rate
  const proDecks = [...proDecksGrouped.values()]
    .sort((a, b) => b.proCount - a.proCount || b.overallWinRate - a.overallWinRate);

  return {
    updatedAt: new Date().toISOString(),
    seasonId: accumulator.seasonId,
    totalBattlesAnalyzed: accumulator.totalBattlesAnalyzed,
    totalPlayersScanned: accumulator.totalPlayersScanned,
    totalRuns: accumulator.totalRunCount || 0,
    metaDecks: metaDecks.slice(0, META_DECKS_OUTPUT_LIMIT),
    proDecks: proDecks.slice(0, PRO_DECKS_OUTPUT_LIMIT),
    proCurrentDecks: [] // Populated by main() after build
  };
}

// ---------------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------------

main().catch(err => {
  console.error("[Fatal Error] Data Pipeline failed:", err);
  process.exit(1);
});
