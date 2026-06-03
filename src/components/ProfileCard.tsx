"use client";

import React, { useState, useMemo } from "react";
import { Translations } from "@/locales/dictionary";
import metaDecksData from "@/data/meta_decks.json";
import { getCardRarity } from "@/utils/cardHelpers";

// Types corresponding to our Route Handler output
interface CRCard {
  name: string;
  id: number;
  level: number;
  maxLevel: number;
  evolutionLevel?: number;
  iconUrls: {
    medium: string;
  };
}

interface ClanInfo {
  tag: string;
  name: string;
  badgeId: number;
}

interface PathOfLegendResult {
  leagueNumber: number;
  trophies?: number;
  rank?: number;
}

interface ProfileCardProps {
  playerData: {
    tag: string;
    name: string;
    expLevel: number;
    trophies: number;
    bestTrophies: number;
    wins: number;
    losses: number;
    battleCount: number;
    threeCrownWins: number;
    clan?: ClanInfo;
    currentPathOfLegendSeasonResult?: PathOfLegendResult;
    currentDeck: CRCard[];
    cards: CRCard[];
  };
  t: Translations;
  viewMode?: "analytics" | "collection";
  onNavigateToCollection?: () => void;
}

// Rarity function getCardRarity imported from @/utils/cardHelpers

const LEAGUE_NAMES: Record<number, string> = {
  1: "Challenger I",
  2: "Challenger II",
  3: "Challenger III",
  4: "Master I",
  5: "Master II",
  6: "Master III",
  7: "Champion",
  8: "Grand Champion",
  9: "Royal Champion",
  10: "Ultimate Champion"
};

export default function ProfileCard({ 
  playerData, 
  t, 
  viewMode = "analytics", 
  onNavigateToCollection 
}: ProfileCardProps) {
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  const totalBattles = playerData.wins + playerData.losses;
  const winRate = totalBattles > 0 ? ((playerData.wins / totalBattles) * 100).toFixed(1) : "0.0";

  // Extract a comprehensive list of unique cards from active meta decks database
  const allGameCards = useMemo(() => {
    const cardMap = new Map<number, any>();
    
    // Scan meta decks
    metaDecksData.metaDecks.forEach(deck => {
      deck.cards.forEach(card => {
        if (!cardMap.has(card.id)) {
          cardMap.set(card.id, { ...card, evolutionLevel: 0 });
        }
        if (card.evolutionLevel && card.evolutionLevel > 0) {
          const regCard = cardMap.get(card.id);
          regCard.canEvolve = true;
        }
      });
    });

    // Scan pro player decks
    metaDecksData.proDecks.forEach(deck => {
      deck.cards.forEach(card => {
        if (!cardMap.has(card.id)) {
          cardMap.set(card.id, { ...card, evolutionLevel: 0 });
        }
        if (card.evolutionLevel && card.evolutionLevel > 0) {
          const regCard = cardMap.get(card.id);
          regCard.canEvolve = true;
        }
      });
    });

    // Fallback: merge anything in current deck just in case
    playerData.currentDeck.forEach(card => {
      if (!cardMap.has(card.id)) {
        cardMap.set(card.id, { ...card, evolutionLevel: card.evolutionLevel || 0 });
      }
    });

    return Array.from(cardMap.values());
  }, [playerData.currentDeck]);

  // Statistics for inventory header
  const totalCards = allGameCards.length;
  const unlockedCards = playerData.cards.length;
  const totalEvos = allGameCards.filter(c => c.canEvolve).length;
  const unlockedEvos = playerData.cards.filter(c => c.evolutionLevel && c.evolutionLevel > 0).length;

  // Filtered registry list for collection tab
  const filteredCollectionCards = useMemo(() => {
    return allGameCards.filter(card => {
      const playerCard = playerData.cards.find(c => c.id === card.id);
      
      if (rarityFilter === "all") return true;
      if (rarityFilter === "evolution") {
        // Evolved registry cards
        return card.canEvolve === true;
      }
      
      const cardRarity = getCardRarity(card);
      return cardRarity === rarityFilter;
    });
  }, [allGameCards, rarityFilter, playerData.cards]);

  const isTurkish = t.activeDeckTab.includes("Savaş");

  // Render Bento Grid Dashboard
  if (viewMode === "analytics") {
    return (
      <div className="bento-grid">
        {/* Card 1: Profile Header Info (Span 2) */}
        <div className="bento-card bento-span-2" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Level badge */}
            <div style={{ 
              width: "3.5rem", 
              height: "3.5rem", 
              borderRadius: "50%", 
              background: "var(--elixir-grad)", 
              border: "2px solid #fff", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
            }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>XP</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{playerData.expLevel}</span>
            </div>
            
            <div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{playerData.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{playerData.tag}</span>
                {playerData.clan && (
                  <span style={{ 
                    fontSize: "0.75rem", 
                    backgroundColor: "rgba(255,255,255,0.04)", 
                    padding: "0.15rem 0.5rem", 
                    borderRadius: "100px", 
                    border: "1px solid var(--panel-border)",
                    color: "var(--text-main)",
                    fontWeight: 600
                  }}>
                    🛡️ {playerData.clan.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--panel-border)" }} />

          {/* Trophy Metrics Row */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {/* Cups */}
            <div style={{ flex: 1, minWidth: "140px", display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={{ color: "#f39c12", fontSize: "2rem" }}>🏆</div>
              <div>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", fontWeight: 700, textTransform: "uppercase" }}>{t.trophiesLabel}</span>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>{playerData.trophies}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>{t.bestTrophiesLabel}: {playerData.bestTrophies}</span>
              </div>
            </div>

            {/* League Rank */}
            {playerData.currentPathOfLegendSeasonResult && (
              <div style={{ flex: 1, minWidth: "180px", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{ color: "var(--secondary)", fontSize: "2rem" }}>👑</div>
                <div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", fontWeight: 700, textTransform: "uppercase" }}>{t.leagueName}</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--secondary)" }}>
                    {LEAGUE_NAMES[playerData.currentPathOfLegendSeasonResult.leagueNumber] || "Ultimate Champion"}
                  </span>
                  {playerData.currentPathOfLegendSeasonResult.rank && (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                      {t.rankLabel}: <strong style={{ color: "#fff" }}>#{playerData.currentPathOfLegendSeasonResult.rank}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Combat Statistics (Span 1) */}
        <div className="bento-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t.winRateLabel}
            </span>
            <div className="text-gradient-elixir" style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "0.25rem" }}>
              {winRate}%
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {playerData.wins}W / {playerData.losses}L
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--panel-border)", paddingTop: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", fontWeight: 600 }}>{t.totalGamesLabel}</span>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{playerData.battleCount}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", fontWeight: 600 }}>{t.threeCrownWinsLabel}</span>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--secondary)" }}>{playerData.threeCrownWins}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Battle Deck Panel (Span 3) */}
        <div className="bento-card bento-span-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>💡 {t.activeDeckTab}</span>
            {onNavigateToCollection && (
              <button 
                onClick={onNavigateToCollection}
                className="btn-secondary active-shrink"
                style={{ padding: "0.4rem 0.85rem", fontSize: "0.75rem", borderRadius: "var(--radius-sm)" }}
              >
                🎒 {t.collectionTab}
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "1rem" }}>
            {playerData.currentDeck.map((card) => {
              const rarity = getCardRarity(card);
              const isEvo = card.evolutionLevel && card.evolutionLevel > 0;
              
              return (
                <div key={card.id} className="card-asset-wrapper">
                  <div className={`card-asset ${isEvo ? "evo-border" : ""} ${rarity === "champion" ? "champion-orange-glow" : ""} ${rarity === "legendary" ? "legendary-blue-glow" : ""}`}>
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
                    />
                    
                    {isEvo && (
                      <div 
                        className="rarity-badge evolution"
                        style={{ 
                          position: "absolute", 
                          top: "4px", 
                          right: "4px", 
                          fontSize: "0.55rem", 
                          padding: "0.1rem 0.25rem",
                          borderRadius: "4px",
                          background: "var(--evo-grad)",
                          color: "#fff",
                          fontWeight: "800",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                          zIndex: 2 
                        }}
                      >
                        EVO
                      </div>
                    )}
                    {rarity === "champion" && (
                      <div 
                        className="rarity-badge champion"
                        style={{ 
                          position: "absolute", 
                          top: "4px", 
                          right: "4px", 
                          fontSize: "0.55rem", 
                          padding: "0.1rem 0.25rem",
                          borderRadius: "4px",
                          background: "var(--gold-grad)",
                          color: "#000",
                          fontWeight: "900",
                          border: "1px solid rgba(255, 255, 255, 0.35)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                          zIndex: 2 
                        }}
                      >
                        👑
                      </div>
                    )}

                    <div 
                      style={{
                        position: "absolute",
                        bottom: 0,
                        width: "100%",
                        background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)",
                        padding: "0.4rem",
                        textAlign: "center"
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#fff" }}>Lvl {card.level}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", marginTop: "0.15rem" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {card.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render Card Inventory Grid View
  return (
    <div>
      {/* Unlocked Stats Info Header */}
      <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", justifySelf: "stretch", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", display: "block" }}>{t.collectionLabel}</span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem", display: "inline-flex", gap: "1.5rem" }}>
            <span style={{ color: "var(--tertiary)", fontWeight: 600 }}>{unlockedCards} / {totalCards} {isTurkish ? "Kart Açık" : "Cards Unlocked"}</span>
            <span style={{ color: "var(--secondary)", fontWeight: 600 }}>{unlockedEvos} / {totalEvos} {isTurkish ? "Evrim Açık" : "Evolutions"}</span>
          </span>
        </div>
      </div>

      {/* Rarity selector filtering block */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem", background: "rgba(0,0,0,0.15)", padding: "0.6rem", borderRadius: "var(--radius-md)", border: "1px solid var(--panel-border)" }}>
        {[
          { id: "all", label: isTurkish ? "Hepsi" : "All", color: "var(--text-main)" },
          { id: "champion", label: "Champions", color: "var(--secondary)" },
          { id: "legendary", label: "Legendary", color: "var(--legendary-blue-start)" },
          { id: "epic", label: "Epic", color: "var(--evo-violet)" },
          { id: "rare", label: "Rare", color: "var(--secondary)" },
          { id: "common", label: "Common", color: "var(--text-muted)" },
          { id: "evolution", label: isTurkish ? "Evrimler" : "Evolutions", color: "var(--primary)" }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setRarityFilter(filter.id)}
            style={{
              fontSize: "0.8rem",
              fontWeight: rarityFilter === filter.id ? 700 : 600,
              padding: "0.4rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              background: rarityFilter === filter.id ? "rgba(255,255,255,0.08)" : "transparent",
              color: rarityFilter === filter.id ? "#fff" : filter.color,
              border: rarityFilter === filter.id ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
              transition: "all var(--transition-fast)"
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Grid of aspect-ratio: 3/4 cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "1.5rem" }}>
        {filteredCollectionCards.map((card) => {
          const playerCard = playerData.cards.find(c => c.id === card.id);
          const isLocked = !playerCard;
          
          const level = playerCard ? playerCard.level : 0;
          const isEvo = playerCard ? (playerCard.evolutionLevel && playerCard.evolutionLevel > 0) : false;
          
          // Evo Locked means: Card registry is flagged canEvolve, but player either doesn't have it unlocked or their unlocked version is not evolved.
          const isEvoLocked = card.canEvolve && !isEvo;
          
          const rarity = getCardRarity(card);

          return (
            <div key={card.id} className="card-asset-wrapper">
              <div className={`card-asset ${isLocked ? "locked" : ""} ${isEvo ? "evo-border" : ""} ${isEvoLocked ? "evo-border" : ""} ${rarity === "champion" ? "champion-orange-glow" : ""} ${rarity === "legendary" ? "legendary-blue-glow" : ""}`}>
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
                />

                {/* Evolved Overlay */}
                {isEvo && (
                  <div 
                    className="rarity-badge evolution"
                    style={{ 
                      position: "absolute", 
                      top: "4px", 
                      right: "4px", 
                      fontSize: "0.55rem", 
                      padding: "0.1rem 0.25rem",
                      borderRadius: "4px",
                      background: "var(--evo-grad)",
                      color: "#fff",
                      fontWeight: "800",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                      zIndex: 2 
                    }}
                  >
                    EVO
                  </div>
                )}

                {/* Champion Overlay */}
                {rarity === "champion" && !isLocked && (
                  <div 
                    className="rarity-badge champion"
                    style={{ 
                      position: "absolute", 
                      top: "4px", 
                      right: "4px", 
                      fontSize: "0.55rem", 
                      padding: "0.1rem 0.25rem",
                      borderRadius: "4px",
                      background: "var(--gold-grad)",
                      color: "#000",
                      fontWeight: "900",
                      border: "1px solid rgba(255, 255, 255, 0.35)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                      zIndex: 2 
                    }}
                  >
                    👑
                  </div>
                )}

                {/* Evo Locked Indicator */}
                {isEvoLocked && (
                  <div className="evo-locked-overlay">
                    <span className="evo-locked-badge-text">
                      {t.lockedEvoBadge}
                    </span>
                  </div>
                )}

                {/* General Locked Overlay */}
                {isLocked && (
                  <div className="locked-overlay">
                    <span className="locked-badge-text">{t.lockedCardBadge}</span>
                  </div>
                )}

                {/* Level Tag (if unlocked) */}
                {!isLocked && (
                  <div 
                    style={{
                      position: "absolute",
                      bottom: 0,
                      width: "100%",
                      background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
                      padding: "0.4rem",
                      textAlign: "center"
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#fff" }}>Lvl {level}</span>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center", marginTop: "0.15rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={card.name}>
                  {card.name}
                </p>
                <p style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  {rarity.toUpperCase()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCollectionCards.length === 0 && (
        <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)", borderRadius: "var(--radius-lg)" }}>
          {isTurkish ? "Kriterlerinize uygun kart bulunamadı." : "No cards matching your criteria found."}
        </div>
      )}
    </div>
  );
}
