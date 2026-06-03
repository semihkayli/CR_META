export interface MatchFilters {
  evoTolerance: number;      // 0, 1, 2
  cardTolerance: number;     // 0, 1, 2
  requiredCardId: number | null; // ID of card that must be present
}

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
  playerName?: string;
  playerTag?: string;
}

export interface MatchResult extends DeckData {
  isFullyMatch: boolean;
  missingCardIds: number[];
  missingEvoIds: number[];
}

/**
 * Matches a list of meta decks against the player's card inventory
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

      // Check each card in the meta deck
      deck.cards.forEach(deckCard => {
        const playerCard = playerCardMap.get(deckCard.id);

        if (!playerCard) {
          // Player does not own this card at all
          missingCardIds.push(deckCard.id);
        } else {
          // Player owns the card, check if evolution is required but missing
          const requiresEvo = deckCard.evolutionLevel && deckCard.evolutionLevel > 0;
          const hasEvo = playerCard.evolutionLevel && playerCard.evolutionLevel > 0;

          if (requiresEvo && !hasEvo) {
            missingEvoIds.push(deckCard.id);
          }
        }
      });

      const isFullyMatch = missingCardIds.length === 0 && missingEvoIds.length === 0;

      return {
        ...deck,
        isFullyMatch,
        missingCardIds,
        missingEvoIds
      };
    })
    .filter(match => {
      // 1. Mandatory card filter
      if (filters.requiredCardId !== null) {
        const hasRequiredCard = match.cards.some(c => c.id === filters.requiredCardId);
        if (!hasRequiredCard) return false;
      }

      // 2. Tolerance filter check
      const cardToleranceOk = match.missingCardIds.length <= filters.cardTolerance;
      const evoToleranceOk = match.missingEvoIds.length <= filters.evoTolerance;

      return cardToleranceOk && evoToleranceOk;
    });
}
