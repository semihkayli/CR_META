"use client";

import React from "react";
import { MatchFilters, DeckCardData } from "@/services/deckMatcher";
import { Translations } from "@/locales/dictionary";

interface FiltersProps {
  playerCards: DeckCardData[];
  filters: MatchFilters;
  onChange: (newFilters: MatchFilters) => void;
  t: Translations; // Added translations prop
}

export default function Filters({ playerCards, filters, onChange, t }: FiltersProps) {
  // Sort player cards alphabetically for the dropdown selection
  const sortedCards = [...playerCards].sort((a, b) => a.name.localeCompare(b.name));

  const handleEvoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      evoTolerance: parseInt(e.target.value, 10)
    });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      cardTolerance: parseInt(e.target.value, 10)
    });
  };

  const handleRequiredCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange({
      ...filters,
      requiredCardId: val === "none" ? null : parseInt(val, 10)
    });
  };

  const hasActiveFilters = filters.evoTolerance > 0 || filters.cardTolerance > 0 || filters.requiredCardId !== null;

  const resetFilters = () => {
    onChange({
      evoTolerance: 0,
      cardTolerance: 0,
      requiredCardId: null
    });
  };

  return (
    <div 
      className="glass-panel filter-panel-flex" 
      style={{ 
        padding: "1.5rem 2rem", 
        marginBottom: "2.5rem", 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "1.5rem", 
        alignItems: "flex-end" 
      }}
    >
      
      {/* Evolution Tolerance Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: "200px" }}>
        <label htmlFor="evo-tolerance-select" style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
          {t.evoFilterLabel}
        </label>
        <select
          id="evo-tolerance-select"
          value={filters.evoTolerance}
          onChange={handleEvoChange}
          className="glass-select"
        >
          <option value={0}>{t.evoFilterOpt0}</option>
          <option value={1}>{t.evoFilterOpt1}</option>
          <option value={2}>{t.evoFilterOpt2}</option>
        </select>
      </div>

      {/* Card Tolerance Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: "200px" }}>
        <label htmlFor="card-tolerance-select" style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
          {t.cardFilterLabel}
        </label>
        <select
          id="card-tolerance-select"
          value={filters.cardTolerance}
          onChange={handleCardChange}
          className="glass-select"
        >
          <option value={0}>{t.cardFilterOpt0}</option>
          <option value={1}>{t.cardFilterOpt1}</option>
          <option value={2}>{t.cardFilterOpt2}</option>
        </select>
      </div>

      {/* Mandatory Card Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: "200px" }}>
        <label htmlFor="required-card-select" style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
          {t.requiredCardLabel}
        </label>
        <select
          id="required-card-select"
          value={filters.requiredCardId || "none"}
          onChange={handleRequiredCardChange}
          className="glass-select"
        >
          <option value="none">{t.requiredCardPlaceholder}</option>
          {sortedCards.map(card => (
            <option key={card.id} value={card.id}>
              {card.name} (Lvl {card.level})
            </option>
          ))}
        </select>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <button 
          onClick={resetFilters}
          className="btn-secondary active-shrink"
          style={{
            padding: "0.55rem 1rem",
            fontSize: "0.85rem",
            color: "var(--elixir)",
            borderColor: "rgba(255, 0, 127, 0.2)",
            height: "38px"
          }}
        >
          {t.clearFiltersButton}
        </button>
      )}

    </div>
  );
}
