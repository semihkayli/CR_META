/**
 * Clash Royale Meta Deck Aggregator Script
 * Run with: node scripts/update-meta.js
 */

const fs = require("fs");
const path = require("path");

// Load .env manually if running standalone
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

// Configuration
const API_BASE_URL = "https://api.clashroyale.com/v1";
const LIMIT_PLAYERS = 100; // Number of top players to scan battle logs for (rate limit friendly)
const MIN_DECK_USE_COUNT = 3; // Minimum games played with a deck to count in meta rankings
const REQUEST_DELAY_MS = 100; // Delay between API calls to stay under 10 req/sec rate limit

// Input/Output paths
const PRO_PLAYERS_PATH = path.join(__dirname, "../src/data/pro_players.json");
const OUTPUT_PATH = path.join(__dirname, "../src/data/meta_decks.json");

// Helper delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff fetch
async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
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

// Curated mock data for failsafe fallback (if API Key is missing)
const MOCK_META_DECKS = {
  updatedAt: new Date().toISOString(),
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
      winRate: 58.6,
      useCount: 142,
      winCount: 83
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
      winRate: 54.2,
      useCount: 98,
      winCount: 53
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
      winRate: 57.1,
      useCount: 84,
      winCount: 48
    }
  ],
  proDecks: [
    {
      playerTag: "#P90G2PY8",
      playerName: "Mohamed Light",
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
      winRate: 83.3,
      useCount: 12,
      winCount: 10
    },
    {
      playerTag: "#GYV2Y0YV",
      playerName: "Mugi",
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
      winRate: 75.0,
      useCount: 8,
      winCount: 6
    }
  ]
};

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
      // Add delay to prevent hitting rate limits
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

async function main() {
  const apiKey = process.env.CLASH_ROYALE_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.warn("[Failsafe Warning] CLASH_ROYALE_API_KEY environment variable is not defined!");
    console.log("[Failsafe Mode] Writing high-quality static MOCK meta decks database to src/data/meta_decks.json...");
    
    // Ensure parent folders exist
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(MOCK_META_DECKS, null, 2), "utf8");
    console.log("[Failsafe Success] Mock meta decks database generated successfully!");

    // Also write mock previous season decks for failsafe mode
    const PREVIOUS_DECKS_FILE = path.join(__dirname, "../src/data/previous_season_decks.json");
    if (!fs.existsSync(PREVIOUS_DECKS_FILE)) {
      const mockPrevDecks = {
        ...MOCK_META_DECKS,
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        metaDecks: MOCK_META_DECKS.metaDecks.map(deck => ({ ...deck, winRate: parseFloat((deck.winRate - 1.5).toFixed(1)) }))
      };
      fs.writeFileSync(PREVIOUS_DECKS_FILE, JSON.stringify(mockPrevDecks, null, 2), "utf8");
      console.log("[Failsafe Success] Mock previous season decks database generated successfully!");
    }

    // Also write mock current season info
    const CURRENT_SEASON_FILE = path.join(__dirname, "../src/data/current_season.json");
    if (!fs.existsSync(CURRENT_SEASON_FILE)) {
      fs.writeFileSync(CURRENT_SEASON_FILE, JSON.stringify({ id: "2026-05", updatedAt: new Date().toISOString() }, null, 2), "utf8");
    }
    
    console.log("[Failsafe Mode] Caching mock card icons locally...");
    await cacheCardIcons(MOCK_META_DECKS.metaDecks, MOCK_META_DECKS.proDecks);
    return;
  }

  console.log(`[Pipeline] Checking current Path of Legend season ID from Clash Royale API...`);
  
  let currentSeasonId = "";
  const CURRENT_SEASON_FILE = path.join(__dirname, "../src/data/current_season.json");
  const PREVIOUS_DECKS_FILE = path.join(__dirname, "../src/data/previous_season_decks.json");

  try {
    const seasonsUrl = `${API_BASE_URL}/locations/global/rankings/pathoflegend/seasons`;
    const seasonsRes = await fetchWithRetry(seasonsUrl, { method: "GET" });
    if (seasonsRes) {
      const seasonsData = await seasonsRes.json();
      if (seasonsData.items && seasonsData.items.length > 0) {
        currentSeasonId = seasonsData.items[0].id;
        console.log(`[Pipeline] Latest season ID from API is: ${currentSeasonId}`);
      }
    }
  } catch (err) {
    console.error(`[Pipeline Warning] Failed to check seasons from API: ${err.message}`);
  }

  if (currentSeasonId) {
    let savedSeason = {};
    if (fs.existsSync(CURRENT_SEASON_FILE)) {
      try {
        savedSeason = JSON.parse(fs.readFileSync(CURRENT_SEASON_FILE, "utf8"));
      } catch (err) {
        console.error(`[Pipeline Error] Failed to read current_season.json: ${err.message}`);
      }
    }

    if (savedSeason.id && savedSeason.id !== currentSeasonId) {
      console.log(`[Pipeline Season Transition] Season ID changed from ${savedSeason.id} to ${currentSeasonId}!`);
      if (fs.existsSync(OUTPUT_PATH)) {
        try {
          fs.copyFileSync(OUTPUT_PATH, PREVIOUS_DECKS_FILE);
          console.log(`[Pipeline Season Transition] Current meta decks archived to: ${PREVIOUS_DECKS_FILE}`);
        } catch (err) {
          console.error(`[Pipeline Error] Failed to archive previous season decks: ${err.message}`);
        }
      }
    } else {
      console.log(`[Pipeline] Season ID remains: ${currentSeasonId}. No transition needed.`);
    }

    try {
      fs.writeFileSync(CURRENT_SEASON_FILE, JSON.stringify({ id: currentSeasonId, updatedAt: new Date().toISOString() }, null, 2), "utf8");
    } catch (err) {
      console.error(`[Pipeline Error] Failed to write current_season.json: ${err.message}`);
    }
  }

  console.log(`[Pipeline] Initializing meta data compilation. scanning top ${LIMIT_PLAYERS} leaderboard players + pros...`);

  let proPlayers = [];
  try {
    if (fs.existsSync(PRO_PLAYERS_PATH)) {
      proPlayers = JSON.parse(fs.readFileSync(PRO_PLAYERS_PATH, "utf8"));
      console.log(`[Pipeline] Loaded ${proPlayers.length} pro players.`);
    }
  } catch (err) {
    console.error(`[Pipeline Error] Failed to read pro_players.json: ${err.message}`);
  }

  const decksMap = new Map(); // deckId -> { cards, useCount, winCount, proPlayersPlayed: [] }

  // Step 1: Fetch Top leaderboard player tags
  let playerTags = [];
  let leaderboardItems = [];
  console.log("[Pipeline] Fetching global leaderboards...");
  const leaderboardUrl = `${API_BASE_URL}/locations/global/rankings/players?limit=${LIMIT_PLAYERS}`;
  
  try {
    const leaderboardRes = await fetchWithRetry(leaderboardUrl, { method: "GET" });
    if (leaderboardRes) {
      const leaderboardData = await leaderboardRes.json();
      if (leaderboardData && leaderboardData.items) {
        leaderboardItems = leaderboardData.items;
        playerTags = leaderboardItems.map(item => item.tag);
        console.log(`[Pipeline] Retrieved ${playerTags.length} players from leaderboard.`);
      }
    } else {
      console.warn("[Pipeline Warning] Failed to fetch leaderboard. Continuing...");
    }
  } catch (err) {
    console.warn(`[Pipeline Warning] Leaderboard query failed: ${err.message}. Continuing...`);
  }

  // Fallback: If player leaderboard is empty (e.g. season reset), fetch players from top clans!
  if (playerTags.length === 0) {
    console.log("[Pipeline Fallback] Player leaderboard is empty. Fetching top global clans to retrieve active players...");
    try {
      const clansUrl = `${API_BASE_URL}/locations/global/rankings/clans?limit=5`;
      const clansRes = await fetchWithRetry(clansUrl, { method: "GET" });
      if (clansRes) {
        const clansData = await clansRes.json();
        if (clansData.items) {
          for (const clan of clansData.items.slice(0, 3)) {
            console.log(`[Pipeline Fallback] Fetching members for clan ${clan.name} (${clan.tag})...`);
            const cleanClanTag = clan.tag.replace("#", "%23");
            const membersUrl = `${API_BASE_URL}/clans/${cleanClanTag}/members`;
            const membersRes = await fetchWithRetry(membersUrl, { method: "GET" });
            if (membersRes) {
              const membersData = await membersRes.json();
              if (membersData.items) {
                const clanPlayerTags = membersData.items.map(m => m.tag);
                playerTags.push(...clanPlayerTags);
                console.log(`[Pipeline Fallback] Added ${clanPlayerTags.length} players from ${clan.name}.`);
                
                membersData.items.forEach(m => {
                  leaderboardItems.push({
                    tag: m.tag,
                    name: m.name,
                    rank: m.clanRank,
                    trophies: m.trophies
                  });
                });
              }
            }
            await delay(100);
          }
          playerTags = [...new Set(playerTags)];
          console.log(`[Pipeline Fallback] Total unique players gathered via clans fallback: ${playerTags.length}`);
        }
      }
    } catch (err) {
      console.error(`[Pipeline Fallback Error] Failed to fetch players from top clans: ${err.message}`);
    }
  }

  // Step 2: Merge in pro players (ensure unique tags) and dynamically treat top leaderboard players as pros
  const proTagsSet = new Set();
  const proPlayerLookup = new Map();

  // Load from static pro_players.json
  proPlayers.forEach(p => {
    const cleanTag = p.tag.replace("#", "");
    proTagsSet.add(cleanTag);
    proPlayerLookup.set(cleanTag, p.name);
  });

  // Also classify top leaderboard players as pros/top players using their leaderboard names
  leaderboardItems.forEach(item => {
    const cleanTag = item.tag.replace("#", "");
    proTagsSet.add(cleanTag);
    if (!proPlayerLookup.has(cleanTag)) {
      proPlayerLookup.set(cleanTag, `${item.name} (Top ${item.rank})`);
    }
  });
  
  const allTargetTags = [...new Set([
    ...proPlayers.map(p => p.tag),
    ...playerTags
  ])].map(tag => tag.replace("#", ""));

  console.log(`[Pipeline] Scanning battlelogs for ${allTargetTags.length} unique player profiles...`);

  // Step 3: Loop through and scan battle logs
  for (let i = 0; i < allTargetTags.length; i++) {
    const tag = allTargetTags[i];
    const isPro = proTagsSet.has(tag);
    const proName = proPlayerLookup.get(tag);

    console.log(`[Pipeline] (${i + 1}/${allTargetTags.length}) Scanning tag #${tag} ${isPro ? `[PRO: ${proName}]` : ""}`);
    
    const battlelogUrl = `${API_BASE_URL}/players/%23${tag}/battlelog`;
    
    // 100ms delay to stay within rate limits (10 req/s)
    await delay(REQUEST_DELAY_MS);
    
    const battlelogRes = await fetchWithRetry(battlelogUrl, { method: "GET" });
    if (!battlelogRes) continue;

    const battles = await battlelogRes.json();
    if (!Array.isArray(battles)) continue;

    for (const battle of battles) {
      // Filter competitive match types - restrict strictly to Path of Legend (Ranked Mode)
      if (battle.type !== "pathOfLegend") {
        continue;
      }

      const team = battle.team && battle.team[0];
      if (!team || !team.cards || team.cards.length !== 8) continue;

      // Extract cards
      const cards = team.cards.map(c => ({
        name: c.name,
        id: c.id,
        evolutionLevel: c.evolutionLevel || 0,
        iconUrls: { medium: c.iconUrls.medium }
      }));

      // Sort cards by ID numerically to create a consistent unique deck signature (deckId)
      const sortedIds = cards.map(c => c.id).sort((a, b) => a - b);
      const deckId = sortedIds.join(";");

      // Verify if player won the match
      const crownsEarned = team.crowns !== undefined ? team.crowns : 0;
      const crownsOpponent = (battle.opponent && battle.opponent[0] && battle.opponent[0].crowns) !== undefined ? battle.opponent[0].crowns : 0;
      const isWin = crownsEarned > crownsOpponent;

      // Update aggregation map
      if (!decksMap.has(deckId)) {
        decksMap.set(deckId, {
          deckId,
          cards,
          useCount: 0,
          winCount: 0,
          prosPlayed: new Map() // proTag -> { name, wins, games }
        });
      }

      const deckStats = decksMap.get(deckId);
      deckStats.useCount += 1;
      if (isWin) deckStats.winCount += 1;

      // If played by a pro, log the pro match detail
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

  console.log(`[Pipeline] Analyzed battle logs. Found ${decksMap.size} distinct deck signatures.`);

  // Step 4: Separate into General Meta and Pro Player Decks
  const metaDecks = [];
  const proDecks = [];

  for (const [deckId, stats] of decksMap.entries()) {
    const winRate = parseFloat(((stats.winCount / stats.useCount) * 100).toFixed(1));
    
    // General meta selection (Needs minimum use count to prevent noise)
    if (stats.useCount >= MIN_DECK_USE_COUNT) {
      metaDecks.push({
        deckId,
        cards: stats.cards,
        winRate,
        useCount: stats.useCount,
        winCount: stats.winCount
      });
    }

    // Pro decks mapping
    if (stats.prosPlayed.size > 0) {
      for (const [proTag, proStat] of stats.prosPlayed.entries()) {
        const proWinRate = parseFloat(((proStat.wins / proStat.games) * 100).toFixed(1));
        proDecks.push({
          playerTag: `#${proTag}`,
          playerName: proStat.name,
          deckId,
          cards: stats.cards,
          winRate: proWinRate,
          useCount: proStat.games,
          winCount: proStat.wins
        });
      }
    }
  }

  // Sort meta decks by use count primarily, then win rate
  metaDecks.sort((a, b) => b.useCount - a.useCount || b.winRate - a.winRate);
  
  // Sort pro decks by win count, then win rate
  proDecks.sort((a, b) => b.useCount - a.useCount || b.winRate - a.winRate);

  // Crop to top list sizes
  const outputData = {
    updatedAt: new Date().toISOString(),
    metaDecks: metaDecks.slice(0, 30),
    proDecks: proDecks.slice(0, 20)
  };

  // Step 5: Save database to path
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), "utf8");
  console.log(`[Pipeline Success] Compiled database saved successfully to ${OUTPUT_PATH}!`);
  console.log(`- Saved ${outputData.metaDecks.length} general meta decks.`);
  console.log(`- Saved ${outputData.proDecks.length} pro player match decks.`);

  // Step 6: Download card icons locally for caching
  console.log("[Pipeline] Starting card icons local caching...");
  await cacheCardIcons(outputData.metaDecks, outputData.proDecks);
}


main().catch(err => {
  console.error("[Fatal Error] Data Pipeline failed:", err);
  process.exit(1);
});
