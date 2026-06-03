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
    DECKS_LIMIT: 50,
    MIN_MATCH_USE_COUNT: 5, // Minimum match occurrences to be considered a meta deck
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
  }
};
