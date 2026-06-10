/**
 * Clash Royale Meta Deck Finder Configuration constants.
 */

export const APP_CONFIG = {
  // Clash Royale API Settings
  API: {
    BASE_URL: "https://api.clashroyale.com/v1",
    PROXY_PATH: "/api/player",
    TIMEOUT_MS: 10000,
  },
  
  // GitHub Action / Data Pipeline Settings
  META_DATA: {
    DECKS_OUTPUT_LIMIT: 50,
    PRO_DECKS_OUTPUT_LIMIT: 30,
    MIN_MATCH_USE_COUNT: 8, // Minimum match occurrences to be considered a meta deck
  },

  // Deck Matcher Algorithm Defaults
  MATCHMAKER: {
    DEFAULT_EVO_TOLERANCE: 0, // Number of missing evolutions allowed by default
    DEFAULT_CARD_TOLERANCE: 0, // Number of missing cards allowed by default
    TOURNAMENT_LEVEL_STANDARD: 11, // Standard tournament card level in CR
  },

  // Game Constants
  GAME: {
    MAX_DECK_CARDS: 8,
    MAX_EVOS_IN_DECK: 2,
    MAX_CHAMPIONS_IN_DECK: 1,
  },

  // Pro Player Discovery Scoring System
  PRO_DISCOVERY: {
    MIN_PRO_SCORE: 40,
    CRL_BADGE_POINTS: 30,
    TOP_FINISH_BADGE_POINTS: 20,
    GC_WIN_POINTS: 2,
    TWENTY_WIN_POINTS: 25,
    POL_TOP10_POINTS: 50,
    POL_TOP100_POINTS: 30,
    POL_TOP1000_POINTS: 15,
    BEST_SEASON_TOP100_POINTS: 25,
    BEST_SEASON_TOP1000_POINTS: 10,
  },

  // Meta Deck Rating Formula Weights
  RATING: {
    WIN_RATE_WEIGHT: 0.6,
    USE_COUNT_WEIGHT: 0.4,
  },
};
