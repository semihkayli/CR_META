"use client";

import React from "react";
import { Translations } from "@/locales/dictionary";
import { getCardRarity, getAverageElixir } from "@/utils/cardHelpers";

interface MetaCard {
  name: string;
  id: number;
  evolutionLevel?: number;
  iconUrls: {
    medium: string;
  };
}

export interface DeckData {
  deckId: string;
  cards: MetaCard[];
  winRate: number;
  useCount: number;
  playerName?: string; // Present for pro decks
  playerTag?: string;  // Present for pro decks
  
  // Matching results from deckMatcher
  isFullyMatch?: boolean;
  missingCardIds?: number[];
  missingEvoIds?: number[];
}

interface DeckCardProps {
  deck: DeckData;
  title?: string;
  t: Translations;
}

// Helper functions getCardRarity, getCardElixir, getAverageElixir imported from @/utils/cardHelpers

export default function DeckCard({ deck, title, t }: DeckCardProps) {
  // Generate the official Clash Royale deck copy link
  const cardIds = deck.cards.map(c => c.id).join(";");
  const copyUrl = `https://link.clashroyale.com/deck/tr?deck=${cardIds}`;

  const isMatchedMode = deck.isFullyMatch !== undefined;
  const isFullyMatch = deck.isFullyMatch === true;
  const missingCardIds = deck.missingCardIds || [];
  const missingEvoIds = deck.missingEvoIds || [];

  // Get names of missing components for warnings
  const missingCardNames = deck.cards
    .filter(c => missingCardIds.includes(c.id))
    .map(c => c.name);

  const missingEvoNames = deck.cards
    .filter(c => missingEvoIds.includes(c.id))
    .map(c => `${c.name} ${t.missingEvoWarning}`);

  // Calculate stats dynamically
  const avgElixir = getAverageElixir(deck.cards);
  
  const isTurkish = t.activeDeckTab.includes("Savaş");
  const synergyLevel = isFullyMatch 
    ? (isTurkish ? "Yüksek Sinerji" : "High Synergy")
    : (missingCardIds.length + missingEvoIds.length <= 1)
      ? (isTurkish ? "Orta Sinerji" : "Med Synergy")
      : (isTurkish ? "Düşük Sinerji" : "Low Synergy");

  // Determine deck name descriptor
  const deckTitle = deck.playerName 
    ? deck.playerName 
    : (title || "Meta Deck");

  const subtitle = deck.playerName
    ? t.proDeckLabel
    : (isTurkish ? "Popüler Sezon Metası" : "Top Tier Season Meta");

  const winRateHigh = deck.winRate >= 55;

  return (
    <article 
      className="bento-card hover-lift"
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "1.25rem",
        height: "100%",
        justifyContent: "space-between"
      }}
    >
      {/* Top Banner (Title & Win Rate) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
            {deckTitle}
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
            {subtitle}
          </p>
        </div>

        {/* Win Rate Badge */}
        <div 
          className={winRateHigh ? "rarity-badge tertiary" : "rarity-badge common"}
          style={{ 
            fontSize: "0.7rem", 
            fontWeight: 800, 
            padding: "0.25rem 0.5rem", 
            borderRadius: "100px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.2rem",
            backgroundColor: winRateHigh ? "rgba(135, 217, 144, 0.15)" : "rgba(100, 116, 139, 0.15)",
            border: winRateHigh ? "1px solid rgba(135, 217, 144, 0.3)" : "1px solid rgba(100, 116, 139, 0.3)"
          }}
        >
          📈 {deck.winRate}% WR
        </div>
      </div>

      {/* 8-Card Grid with Stitch Aspect-Ratio */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "0.4rem", 
          background: "rgba(0,0,0,0.15)", 
          padding: "0.5rem", 
          borderRadius: "var(--radius-md)"
        }}
      >
        {deck.cards.map((card) => {
          const isEvo = card.evolutionLevel && card.evolutionLevel > 0;
          const isCardMissing = missingCardIds.includes(card.id);
          const isEvoMissing = missingEvoIds.includes(card.id);
          const rarity = getCardRarity(card);

          return (
            <div 
              key={card.id} 
              className={`card-asset ${isCardMissing ? "locked" : ""} ${isEvo ? "evo-border" : ""} ${isEvoMissing ? "evo-border" : ""} ${rarity === "champion" ? "champion-orange-glow" : ""} ${rarity === "legendary" ? "legendary-blue-glow" : ""}`}
              style={{
                borderWidth: (isEvo || isEvoMissing) ? "1.5px" : "1px"
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`/images/cards/${card.id}.png`} 
                onError={(e) => {
                  if (e.currentTarget.src !== card.iconUrls.medium) {
                    e.currentTarget.src = card.iconUrls.medium;
                  }
                }}
                alt={card.name} 
                loading="lazy"
                title={card.name}
              />

              {/* EVO Badge */}
              {isEvo && !isEvoMissing && (
                <div 
                  className="rarity-badge evolution" 
                  style={{ 
                    position: "absolute", 
                    top: "1px", 
                    right: "1px", 
                    fontSize: "0.45rem", 
                    padding: "0.05rem 0.15rem",
                    borderRadius: "2px",
                    zIndex: 2
                  }}
                >
                  EVO
                </div>
              )}

              {/* EVO LOCKED Badge Overlay */}
              {isEvoMissing && (
                <div className="evo-locked-overlay">
                  <span className="evo-locked-badge-text" style={{ fontSize: "0.45rem", padding: "0.1rem 0.25rem" }}>
                    {t.lockedEvoBadge}
                  </span>
                </div>
              )}

              {/* CARD LOCKED Badge Overlay */}
              {isCardMissing && (
                <div className="locked-overlay">
                  <span className="locked-badge-text" style={{ fontSize: "0.45rem" }}>
                    {t.lockedCardBadge}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dynamic Stats Row (Elixir average & Synergy index) */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderTop: "1px solid var(--panel-border)",
          paddingTop: "0.6rem"
        }}
      >
        <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
          {/* Elixir */}
          <span 
            style={{ 
              fontSize: "0.75rem", 
              color: "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem"
            }}
          >
            <span className="material-symbols-outlined text-gradient-elixir" style={{ fontSize: "16px", fontWeight: "bold" }}>water_drop</span>
            <strong style={{ color: "var(--text-main)" }}>{avgElixir}</strong> Avg
          </span>

          {/* Synergy */}
          <span 
            style={{ 
              fontSize: "0.75rem", 
              color: "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem" 
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>group_work</span>
            <span>{synergyLevel}</span>
          </span>
        </div>
      </div>

      {/* Missing Warning Details Row */}
      {isMatchedMode && !isFullyMatch && (
        <div 
          style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.03)", 
            border: "1px solid rgba(239, 68, 68, 0.12)", 
            padding: "0.5rem 0.75rem", 
            borderRadius: "var(--radius-sm)", 
            fontSize: "0.75rem"
          }}
        >
          {missingCardNames.length > 0 && (
            <div style={{ color: "#ff8080", fontWeight: 500, display: "flex", gap: "0.3rem", alignItems: "center" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ff4d4d", flexShrink: 0 }}></span>
              <span>{t.missingCardWarning}: {missingCardNames.join(", ")}</span>
            </div>
          )}
          {missingEvoNames.length > 0 && (
            <div style={{ color: "#c084fc", fontWeight: 500, marginTop: missingCardNames.length > 0 ? "0.25rem" : 0, display: "flex", gap: "0.3rem", alignItems: "center" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--evo-violet)", flexShrink: 0 }}></span>
              <span>{missingEvoNames.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Match success badge */}
      {isMatchedMode && isFullyMatch && (
        <div 
          style={{ 
            backgroundColor: "rgba(46, 204, 113, 0.08)", 
            border: "1px solid rgba(46, 204, 113, 0.25)", 
            padding: "0.4rem", 
            borderRadius: "var(--radius-sm)", 
            fontSize: "0.75rem", 
            fontWeight: 700,
            color: "#2ecc71",
            textAlign: "center",
            letterSpacing: "0.02em"
          }}
        >
          {t.fullyMatchBadge}
        </div>
      )}

      {/* Use counts and CTA copy action button */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginTop: "0.25rem"
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {deck.useCount} {t.deckMatches}
        </span>
        
        <a 
          href={copyUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-elixir active-shrink" 
          style={{ 
            padding: "0.35rem 0.75rem", 
            fontSize: "0.8rem", 
            borderRadius: "var(--radius-sm)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem"
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>content_copy</span>
          <span>{t.copyButton}</span>
        </a>
      </div>
    </article>
  );
}
