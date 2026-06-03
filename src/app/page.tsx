"use client";

import React, { useState, useEffect, useRef } from "react";
import ProfileCard from "@/components/ProfileCard";
import DeckCard from "@/components/DeckCard";
import Filters from "@/components/Filters";
import { matchDecks, MatchFilters } from "@/services/deckMatcher";
import { dictionary, Language } from "@/locales/dictionary";

// Import compiled meta decks database
import metaDecksData from "@/data/meta_decks.json";
import previousSeasonDecksData from "@/data/previous_season_decks.json";

export default function Home() {
  const [playerTag, setPlayerTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"meta" | "analytics" | "collection" | "pro">("meta");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for Language and Theme (i18n & Dark Mode)
  const [lang, setLang] = useState<Language>("tr");
  const [theme, setTheme] = useState<string>("dark");

  // Filtering states
  const [filters, setFilters] = useState<MatchFilters>({
    evoTolerance: 0,
    cardTolerance: 0,
    requiredCardId: null
  });

  // Season Selection State
  const [selectedSeason, setSelectedSeason] = useState<"active" | "prev">("active");

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("crmeta-lang") as Language;
    if (savedLang === "tr" || savedLang === "en") {
      setLang(savedLang);
    }

    const savedTheme = localStorage.getItem("crmeta-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Click outside to close language dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("crmeta-theme", newTheme);
  };

  const toggleLang = () => {
    const newLang = lang === "tr" ? "en" : "tr";
    setLang(newLang);
    localStorage.setItem("crmeta-lang", newLang);
  };

  // Get active translation dictionary
  const t = dictionary[lang];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedTag = playerTag.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (!cleanedTag) {
      setError(t.invalidTagError);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Reset filters on new search
    setFilters({
      evoTolerance: 0,
      cardTolerance: 0,
      requiredCardId: null
    });

    try {
      const response = await fetch(`/api/player/${cleanedTag}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Sunucu hatası: ${response.status}`);
      }
      
      setPlayerData(data);
      // Auto-navigate to player analytics dashboard
      setActiveTab("analytics");
      setSidebarOpen(false);
    } catch (err: any) {
      console.error("Error fetching player:", err);
      setError(err.message || t.noDecksFound);
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  };

  // Run matching algorithm dynamically
  const seasonData = selectedSeason === "active" ? metaDecksData : previousSeasonDecksData;
  const metaDecksSource = seasonData.metaDecks;
  const proDecksSource = seasonData.proDecks;

  const matchedMetaDecks = playerData 
    ? matchDecks(playerData.cards, metaDecksSource, filters)
    : metaDecksSource;

  const matchedProDecks = playerData
    ? matchDecks(playerData.cards, proDecksSource, filters)
    : proDecksSource;

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar (Desktop fixed, Mobile toggleable) */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Mobile Sidebar Close Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }} className="lg-hidden">
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Menu</span>
          <button 
            onClick={() => setSidebarOpen(false)} 
            style={{ color: "var(--text-muted)", padding: "0.25rem" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Sidebar Logo Header */}
        <div className="sidebar-logo-container">
          <div className="logo-icon-container" style={{ 
            width: "2.5rem", 
            height: "2.5rem", 
            borderRadius: "var(--radius-md)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}>
            {/* Clash Royale Inspired Crown/Drop SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 18V9L8 13L12 6L16 13L20 9V18H4Z" fill="#ffffff" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round"/>
              <circle cx="4" cy="7" r="1.5" fill="#ffd700"/>
              <circle cx="12" cy="4" r="1.5" fill="#ffd700"/>
              <circle cx="20" cy="7" r="1.5" fill="#ffd700"/>
              <path d="M12 12C12 12 9 14.5 9 16C9 17.6569 10.3431 19 12 19C13.6569 19 15 17.6569 15 16C15 14.5 12 12 12 12Z" fill="#ff5ebc"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-title">CR<span className="text-gradient-gold">META</span></div>
            <div className="sidebar-logo-subtitle">{t.subtitleText}</div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="sidebar-menu">
          <button 
            onClick={() => { setActiveTab("meta"); setSidebarOpen(false); }}
            className={`sidebar-link ${activeTab === "meta" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined">style</span>
            <span>{t.metaDecksTab}</span>
          </button>

          <button 
            onClick={() => { setActiveTab("analytics"); setSidebarOpen(false); }}
            className={`sidebar-link ${activeTab === "analytics" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined">leaderboard</span>
            <span>{t.profileTitle}</span>
          </button>

          <button 
            onClick={() => { setActiveTab("collection"); setSidebarOpen(false); }}
            className={`sidebar-link ${activeTab === "collection" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span>{t.collectionTab}</span>
          </button>

          <button 
            onClick={() => { setActiveTab("pro"); setSidebarOpen(false); }}
            className={`sidebar-link ${activeTab === "pro" ? "active" : ""}`}
          >
            <span className="material-symbols-outlined">sports_esports</span>
            <span>{t.proDecksTab}</span>
          </button>
        </nav>

        {/* Sidebar Footer with Language / Theme settings */}
        <div className="sidebar-footer">
          {/* Searched Player Summary Mini Card */}
          {playerData && (
            <div className="sidebar-profile-card">
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{ 
                  width: "2.2rem", 
                  height: "2.2rem", 
                  borderRadius: "50%", 
                  background: "var(--gold-grad)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  color: "#000" 
                }}>
                  {playerData.expLevel}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div className="sidebar-profile-name" style={{ margin: 0 }}>{playerData.name}</div>
                  <div className="sidebar-profile-detail">{playerData.tag}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Row removed from here */}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="dashboard-main">
        {/* Sticky Header with Search, Language, Theme */}
        <header className="dashboard-header" ref={dropdownRef}>
          {/* Mobile hamburger menu toggle */}
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg-hidden" 
            style={{ color: "var(--secondary)", marginRight: "1rem", display: "flex", alignItems: "center" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Centered Search Bar */}
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", flex: 1, maxWidth: "450px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ 
                position: "absolute", 
                left: "1rem", 
                top: "50%", 
                transform: "translateY(-50%)", 
                color: "var(--text-muted)", 
                fontWeight: 700 
              }}>#</span>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={playerTag}
                onChange={(e) => setPlayerTag(e.target.value)}
                id="player-tag-input"
                className="glass-input"
                style={{ paddingLeft: "1.75rem", height: "38px", paddingTop: 0, paddingBottom: 0, fontSize: "0.85rem" }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-elixir active-shrink" 
              style={{ padding: "0 1.25rem", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {loading ? (
                <svg width="18" height="18" viewBox="0 0 38 38" stroke="#fff">
                  <g fill="none" fillRule="evenodd">
                    <g transform="translate(1 1)" strokeWidth="3">
                      <circle strokeOpacity=".2" cx="18" cy="18" r="18"/>
                      <path d="M36 18c0-9.94-8.06-18-18-18">
                        <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
                      </path>
                    </g>
                  </g>
                </svg>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>search</span>
              )}
            </button>
          </form>

          {/* Search status or quick help indicator */}
          <div className="xl-flex-only" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {playerData ? (
              <span style={{ color: "var(--tertiary)", fontWeight: 600 }}>● {playerData.name} ({playerData.tag})</span>
            ) : (
              <span>{t.searchHint}</span>
            )}
          </div>

          {/* Top Bar Actions (Right side of header) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Language Select Dropdown Trigger */}
            <div style={{ position: "relative" }}>
              <button 
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)} 
                className="flag-capsule-btn active-shrink" 
                style={{ height: "38px" }}
                title={t.languageLabel}
              >
                <span style={{ fontSize: "1.1rem" }}>{lang === "tr" ? "🇹🇷" : "🇬🇧"}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{lang.toUpperCase()}</span>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", margin: 0 }}>arrow_drop_down</span>
              </button>
              
              {/* Dropdown Menu */}
              {langMenuOpen && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    position: "absolute", 
                    right: 0, 
                    top: "44px", 
                    minWidth: "140px", 
                    borderRadius: "var(--radius-md)", 
                    padding: "0.35rem", 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "0.25rem",
                    zIndex: 100,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setLang("tr"); localStorage.setItem("crmeta-lang", "tr"); setLangMenuOpen(false); }}
                    style={{ 
                      padding: "0.5rem 0.75rem", 
                      borderRadius: "var(--radius-sm)", 
                      fontSize: "0.8rem", 
                      textAlign: "left",
                      width: "100%",
                      fontWeight: lang === "tr" ? 700 : 500,
                      backgroundColor: lang === "tr" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                      color: lang === "tr" ? "var(--secondary)" : "var(--text-main)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                    className="active-shrink"
                  >
                    <span>🇹🇷</span> Türkçe (TR)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLang("en"); localStorage.setItem("crmeta-lang", "en"); setLangMenuOpen(false); }}
                    style={{ 
                      padding: "0.5rem 0.75rem", 
                      borderRadius: "var(--radius-sm)", 
                      fontSize: "0.8rem", 
                      textAlign: "left",
                      width: "100%",
                      fontWeight: lang === "en" ? 700 : 500,
                      backgroundColor: lang === "en" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                      color: lang === "en" ? "var(--secondary)" : "var(--text-main)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                    className="active-shrink"
                  >
                    <span>🇬🇧</span> English (EN)
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button 
              type="button"
              onClick={toggleTheme} 
              className="btn-secondary active-shrink" 
              style={{ padding: "0 0.75rem", height: "38px", display: "flex", alignItems: "center", justifySelf: "center", borderRadius: "100px" }}
              title={t.themeLabel}
            >
              <span className="material-symbols-outlined theme-icon-rotate" style={{ fontSize: "20px" }}>
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="dashboard-content">
          {/* Global Error Banner */}
          {error && (
            <div className="glass-panel" style={{ padding: "1rem", marginBottom: "2rem", border: "1px solid rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)", borderRadius: "var(--radius-lg)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "#ef4444" }}>error</span>
              <span style={{ fontSize: "0.85rem", color: "#f87171" }}>{error}</span>
            </div>
          )}

          {/* Render Tab 1: Meta Decks */}
          {activeTab === "meta" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{t.metaDecksTab}</h2>
                  
                  {/* Season Dropdown Selector */}
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value as "active" | "prev")}
                    className="glass-select"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", height: "32px", border: "1px solid var(--panel-border)" }}
                  >
                    <option value="active">⚡ {t.activeSeasonLabel}</option>
                    <option value="prev">📅 {t.prevSeasonLabel}</option>
                  </select>
                </div>

                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {playerData ? t.filteredNotice : t.unfilteredNotice} ({matchedMetaDecks.length})
                </span>
              </div>

              {/* Simulation Filters Box */}
              {playerData && (
                <Filters 
                  playerCards={playerData.cards} 
                  filters={filters} 
                  onChange={setFilters} 
                  t={t}
                />
              )}

              {/* Results grid */}
              <div className="grid-responsive-decks" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {matchedMetaDecks.map((deck, idx) => (
                  <DeckCard 
                    key={deck.deckId} 
                    deck={deck} 
                    title={`${t.metaDecksTab} #${idx + 1}`} 
                    t={t}
                  />
                ))}
              </div>

              {matchedMetaDecks.length === 0 && (
                <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)", borderRadius: "var(--radius-lg)" }}>
                  {t.noDecksFound}
                </div>
              )}
            </div>
          )}

          {/* Render Tab 2: Pro Matches */}
          {activeTab === "pro" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{t.proDecksTab}</h2>
                  
                  {/* Season Dropdown Selector */}
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value as "active" | "prev")}
                    className="glass-select"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", height: "32px", border: "1px solid var(--panel-border)" }}
                  >
                    <option value="active">⚡ {t.activeSeasonLabel}</option>
                    <option value="prev">📅 {t.prevSeasonLabel}</option>
                  </select>
                </div>

                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {playerData ? t.filteredNotice : t.unfilteredNotice} ({matchedProDecks.length})
                </span>
              </div>

              {/* Simulation Filters Box */}
              {playerData && (
                <Filters 
                  playerCards={playerData.cards} 
                  filters={filters} 
                  onChange={setFilters} 
                  t={t}
                />
              )}

              {/* Results grid */}
              <div className="grid-responsive-decks" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {matchedProDecks.map((deck) => (
                  <DeckCard 
                    key={`${deck.playerTag}-${deck.deckId}`} 
                    deck={deck} 
                    t={t}
                  />
                ))}
              </div>

              {matchedProDecks.length === 0 && (
                <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)", borderRadius: "var(--radius-lg)" }}>
                  {t.noDecksFound}
                </div>
              )}
            </div>
          )}

          {/* Render Tab 3: Analytics (Active Player Profile Stats Bento Grid) */}
          {activeTab === "analytics" && (
            playerData ? (
              <div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{t.profileTitle}</h2>
                </div>
                <ProfileCard playerData={playerData} t={t} viewMode="analytics" onNavigateToCollection={() => setActiveTab("collection")} />
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", borderRadius: "var(--radius-lg)", maxWidth: "600px", margin: "2rem auto" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "4rem", color: "var(--secondary)", marginBottom: "1rem" }}>account_circle</span>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  {lang === "tr" ? "Lütfen Önce Oyuncu Arayın" : "Please Search a Player First"}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {lang === "tr" 
                    ? "Profil istatistiklerinizi ve analizlerinizi görüntülemek için üst kısımdaki arama kutusuna Clash Royale oyuncu etiketinizi (örneğin #G9YV9GR8R) girip aratın." 
                    : "To view your profile stats and analytics, please search your Clash Royale player tag (e.g. #G9YV9GR8R) in the top search bar."}
                </p>
              </div>
            )
          )}

          {/* Render Tab 4: My Collection */}
          {activeTab === "collection" && (
            playerData ? (
              <div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{t.collectionTab}</h2>
                </div>
                <ProfileCard playerData={playerData} t={t} viewMode="collection" />
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", borderRadius: "var(--radius-lg)", maxWidth: "600px", margin: "2rem auto" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "4rem", color: "var(--primary)", marginBottom: "1rem" }}>inventory_2</span>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  {lang === "tr" ? "Lütfen Önce Oyuncu Arayın" : "Please Search a Player First"}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {lang === "tr" 
                    ? "Kart koleksiyonunuzu ve evrimlerinizi incelemek için üst kısımdaki arama kutusuna Clash Royale oyuncu etiketinizi girip aratın." 
                    : "To inspect your card collection and evolutions, please search your Clash Royale player tag in the top search bar."}
                </p>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
