'use client';

import { useMemo, useState } from 'react';
import { 
  matchDecks, 
  getDefaultFilters, 
  MatchFilters, 
  MatchResult, 
  DeckData, 
  DeckCardData 
} from '@/services/deckMatcher';

interface UseDeckMatcherProps {
  playerCards: DeckCardData[];
  metaDecks: DeckData[];
}

export function useDeckMatcher({ playerCards, metaDecks }: UseDeckMatcherProps) {
  const [filters, setFilters] = useState<MatchFilters>(getDefaultFilters());

  // useMemo ensures that we only recalculate when filters, playerCards, or metaDecks change.
  // This provides the 0ms latency feel when toggling filter pills.
  const matchedDecks: MatchResult[] = useMemo(() => {
    if (!metaDecks || metaDecks.length === 0) return [];
    if (!playerCards || playerCards.length === 0) return metaDecks as MatchResult[];

    return matchDecks(playerCards, metaDecks, filters);
  }, [playerCards, metaDecks, filters]);

  const updateFilters = (newFilters: MatchFilters) => {
    setFilters(newFilters);
  };

  return {
    filters,
    updateFilters,
    matchedDecks
  };
}
