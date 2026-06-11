export interface SlotConfig {
  evoSlotCardId: number;
  championSlotCardId: number;
  flexSlotCardId: number | null;
  flexSlotType: "evolution" | "champion" | null;
}

export interface ProPlayerInfo {
  tag: string;
  name: string;
  useCount: number;
  winCount: number;
  winRate: number;
}

export interface MatchFilters {
  evoTolerance: number;        // 0, 1, 2 — how many missing evolutions to tolerate
  heroTolerance: number;       // 0, 1, 2 — how many missing hero-slot cards to tolerate
  cardTolerance: number;       // 0, 1, 2 — how many other missing cards to tolerate
  requiredCardId: number | null; // ID of card that must be present
  sortBy: SortOption;          // Sorting criteria
}

/**
 * Sorting options for meta deck results.
 * - "recommended": Rating formula (winRate × 0.6 + normalized useCount × 0.4)
 * - "mostPlayed": Sort by useCount descending
 * - "highestWinRate": Sort by winRate descending
 */
export type SortOption = "recommended" | "mostPlayed" | "highestWinRate";

export interface DeckCardData {
  name: string;
  id: number;
  level?: number;
  evolutionLevel?: number;
  iconUrls: {
    medium: string;
  };
}

export interface DeckData {
  deckId: string;
  cards: DeckCardData[];
  winRate: number;
  useCount: number;
  winCount?: number;
  rating?: number;
  slotConfig?: SlotConfig;
  playerName?: string;
  playerTag?: string;
}

export interface ProDeckData {
  deckId: string;
  cards: DeckCardData[];
  slotConfig?: SlotConfig;
  totalUseCount: number;
  totalWinCount: number;
  overallWinRate: number;
  proCount: number;
  pros: ProPlayerInfo[];
}

export interface MatchResult extends DeckData {
  isFullyMatch: boolean;
  missingCardIds: number[];
  missingEvoIds: number[];
  missingHeroIds: number[];   // Hero-slot cards the player doesn't own
}

/**
 * Checks if a card ID belongs to a Hero/Champion card.
 * Hero cards occupy the Hero Slot (slot 1) or Wild Slot (slot 2).
 * 
 * In the CR API, hero/champion cards are identified by:
 * - Having "rarity": "Champion" in cards_static.json
 * - Or being in the champion slot of a deck's slotConfig
 * 
 * Since we track slotConfig per deck, we use that to determine
 * which cards are used as heroes in each specific deck.
 */
function isHeroSlotCard(cardId: number, slotConfig?: SlotConfig): boolean {
  if (!slotConfig) return false;
  return (
    cardId === slotConfig.championSlotCardId ||
    (slotConfig.flexSlotType === "champion" && cardId === slotConfig.flexSlotCardId)
  );
}

/**
 * Matches a list of meta decks against the player's card inventory.
 * 
 * Filter logic:
 * - evoTolerance: allows N missing evolutions (player has card but not the evo)
 * - heroTolerance: allows N missing hero-slot cards (player doesn't own the hero card at all)
 * - cardTolerance: allows N missing non-hero cards (player doesn't own a regular card)
 * - requiredCardId: if set, only decks containing this card are returned
 * - sortBy: determines the sorting order of results
 */
export function matchDecks(
  playerCards: DeckCardData[],
  metaDecks: DeckData[],
  filters: MatchFilters
): MatchResult[] {
  // Create a map of player cards for O(1) lookup
  const playerCardMap = new Map<number, DeckCardData>();
  playerCards.forEach(card => {
    playerCardMap.set(card.id, card);
  });

  return metaDecks
    .map(deck => {
      const missingCardIds: number[] = [];
      const missingEvoIds: number[] = [];
      const missingHeroIds: number[] = [];

      // Check each card in the meta deck
      deck.cards.forEach(deckCard => {
        const playerCard = playerCardMap.get(deckCard.id);

        if (!playerCard) {
          // Player does not own this card at all
          // Classify: is this a hero-slot card or a regular card?
          if (isHeroSlotCard(deckCard.id, deck.slotConfig)) {
            missingHeroIds.push(deckCard.id);
          } else {
            missingCardIds.push(deckCard.id);
          }
        } else {
          // Player owns the card, check if evolution is required but missing
          const requiresEvo = deckCard.evolutionLevel && deckCard.evolutionLevel > 0;
          const hasEvo = playerCard.evolutionLevel && playerCard.evolutionLevel > 0;

          if (requiresEvo && !hasEvo) {
            missingEvoIds.push(deckCard.id);
          }
        }
      });

      const isFullyMatch =
        missingCardIds.length === 0 &&
        missingEvoIds.length === 0 &&
        missingHeroIds.length === 0;

      return {
        ...deck,
        isFullyMatch,
        missingCardIds,
        missingEvoIds,
        missingHeroIds
      };
    })
    .filter(match => {
      // 1. Mandatory card filter
      if (filters.requiredCardId !== null) {
        const hasRequiredCard = match.cards.some(c => c.id === filters.requiredCardId);
        if (!hasRequiredCard) return false;
      }

      // 2. Tolerance filter check (each category independently)
      const cardToleranceOk = match.missingCardIds.length <= filters.cardTolerance;
      const evoToleranceOk = match.missingEvoIds.length <= filters.evoTolerance;
      const heroToleranceOk = match.missingHeroIds.length <= filters.heroTolerance;

      return cardToleranceOk && evoToleranceOk && heroToleranceOk;
    })
    .sort((a, b) => sortDecks(a, b, filters.sortBy));
}

/**
 * Sort comparator for deck results based on the selected sort option.
 */
function sortDecks(a: MatchResult, b: MatchResult, sortBy: SortOption): number {
  switch (sortBy) {
    case "mostPlayed":
      return b.useCount - a.useCount;
    case "highestWinRate":
      return b.winRate - a.winRate;
    case "recommended":
    default:
      return (b.rating || 0) - (a.rating || 0);
  }
}

/**
 * Returns the default filter values.
 */
export function getDefaultFilters(): MatchFilters {
  return {
    evoTolerance: 0,
    heroTolerance: 0,
    cardTolerance: 0,
    requiredCardId: null,
    sortBy: "recommended"
  };
}
