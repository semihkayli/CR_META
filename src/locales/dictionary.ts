export type Language = "tr" | "en";

export const dictionary = {
  tr: {
    // Navigation / Header
    logoText: "CRMETA",
    subtitleText: "Sezon Metası Canlı",
    metaDecksTab: "Aktif Meta Desteleri",
    proDecksTab: "E-Sporcu (Pro) Desteleri",
    sonGuncelleme: "Son Güncelleme",
    languageLabel: "Dil",
    themeLabel: "Tema",
    activeSeasonLabel: "Aktif Sezon Metası",
    prevSeasonLabel: "Geçmiş Sezon Metası",
    seasonSelectLabel: "Sezon",
    
    // Search Panel
    searchTitle: "Oyuncu Profilini Sorgula",
    searchDescription: "Oyuncu etiketini girerek kart seviyelerine ve evrimlerine en uygun meta destelerini filtreleyin.",
    searchPlaceholder: "Örn: MOCK veya oyuncu tagı girin",
    searchButton: "Sorgula",
    searchHint: "Hızlı test için kutuya MOCK yazıp aramayı tetikleyin.",
    invalidTagError: "Lütfen geçerli bir oyuncu etiketi girin.",
    
    // Stats Card (ProfileCard)
    profileTitle: "Oyuncu Profili",
    leagueName: "Yolun Efsanesi",
    trophiesLabel: "Kupalar",
    bestTrophiesLabel: "En Yüksek",
    winRateLabel: "Kazanma Oranı",
    totalGamesLabel: "Toplam Maç",
    threeCrownWinsLabel: "3 Taç Galibiyeti",
    collectionLabel: "Kart Koleksiyonu",
    activeDeckTab: "Aktif Savaş Destesi (8 Kart)",
    collectionTab: "Kart Koleksiyonu",
    rankLabel: "Dünya Sıralaması",
    
    // Filters Panel
    filterPanelTitle: "Simülasyon Filtreleri",
    evoFilterLabel: "Evrim Simülasyonu",
    evoFilterOpt0: "Sadece Açık Evrimler (Toleranssız)",
    evoFilterOpt1: "1 Evrim Açabilirim (+1 Eksik)",
    evoFilterOpt2: "2 Evrim Açabilirim (+2 Eksik)",
    
    cardFilterLabel: "Eksik Kart / Kahraman Simülasyonu",
    cardFilterOpt0: "Sadece Sahip Olduğum Kartlar",
    cardFilterOpt1: "1 Kart Eksik Olabilir (+1 Kilitli)",
    cardFilterOpt2: "2 Kart Eksik Olabilir (+2 Kilitli)",
    
    requiredCardLabel: "Destede Bulunması Zorunlu Kart",
    requiredCardPlaceholder: "Zorunlu kart seçilmedi",
    clearFiltersButton: "Filtreleri Temizle",
    filteredNotice: "Filtrelenmiş Sonuçlar Gösteriliyor",
    unfilteredNotice: "Sezon Sıralama Maçları Analizi",
    
    // Deck Card
    proDeckLabel: "PRO OYUNCU DESTESİ",
    deckWinRate: "Kazanma Oranı",
    deckMatches: "Maç Taraması",
    copyButton: "Oyuna Kopyala",
    lockedCardBadge: "KİLİTLİ",
    lockedEvoBadge: "EVO KİLİTLİ",
    missingCardWarning: "Eksik Kart",
    missingEvoWarning: "Gereksinim",
    fullyMatchBadge: "✓ BU DESTEYİ HEMEN OYNAYABİLİRSİNİZ",
    noDecksFound: "Kriterlerinize uygun bir deste bulunamadı. Eksik kart/evrim toleransını artırmayı deneyin.",
    
    // General
    rightsReserved: "© 2026 CRMETA. Tüm hakları saklıdır. Bu site ticari amaç gütmemektedir.",
    poweredBy: "Next.js 16 & Vanilla CSS"
  },
  en: {
    // Navigation / Header
    logoText: "CRMETA",
    subtitleText: "Season Meta Live",
    metaDecksTab: "Active Meta Decks",
    proDecksTab: "Pro Player Decks",
    sonGuncelleme: "Last Update",
    languageLabel: "Language",
    themeLabel: "Theme",
    activeSeasonLabel: "Current Season Meta",
    prevSeasonLabel: "Previous Season Meta",
    seasonSelectLabel: "Season",
    
    // Search Panel
    searchTitle: "Search Player Profile",
    searchDescription: "Enter your player tag to filter the best meta decks matching your card levels and evolutions.",
    searchPlaceholder: "E.g. MOCK or enter player tag",
    searchButton: "Search",
    searchHint: "Type MOCK inside the box for a quick local test.",
    invalidTagError: "Please enter a valid player tag.",
    
    // Stats Card (ProfileCard)
    profileTitle: "Player Profile",
    leagueName: "Path of Legend",
    trophiesLabel: "Trophies",
    bestTrophiesLabel: "Best",
    winRateLabel: "Win Rate",
    totalGamesLabel: "Total Games",
    threeCrownWinsLabel: "3 Crown Wins",
    collectionLabel: "Card Collection",
    activeDeckTab: "Active Battle Deck (8 Cards)",
    collectionTab: "Card Collection",
    rankLabel: "World Rank",
    
    // Filters Panel
    filterPanelTitle: "Simulation Filters",
    evoFilterLabel: "Evolution Simulation",
    evoFilterOpt0: "Unlocked Evos Only (No Tolerance)",
    evoFilterOpt1: "I Can Unlock 1 Evo (+1 Missing)",
    evoFilterOpt2: "I Can Unlock 2 Evos (+2 Missing)",
    
    cardFilterLabel: "Missing Card / Champion Simulation",
    cardFilterOpt0: "Only Owned Cards",
    cardFilterOpt1: "1 Card Can Be Missing (+1 Locked)",
    cardFilterOpt2: "2 Cards Can Be Missing (+2 Locked)",
    
    requiredCardLabel: "Mandatory Card in Deck",
    requiredCardPlaceholder: "No required card selected",
    clearFiltersButton: "Clear Filters",
    filteredNotice: "Showing Filtered Results",
    unfilteredNotice: "Season Rankings Match Analysis",
    
    // Deck Card
    proDeckLabel: "PRO PLAYER DECK",
    deckWinRate: "Win Rate",
    deckMatches: "Matches Scanned",
    copyButton: "Copy Deck",
    lockedCardBadge: "LOCKED",
    lockedEvoBadge: "EVO LOCKED",
    missingCardWarning: "Missing Card",
    missingEvoWarning: "Requirement",
    fullyMatchBadge: "✓ YOU CAN PLAY THIS DECK IMMEDIATELY",
    noDecksFound: "No decks found matching your criteria. Try increasing missing card/evolution tolerance.",
    
    // General
    rightsReserved: "© 2026 CRMETA. All rights reserved. This site is non-commercial.",
    poweredBy: "Next.js 16 & Vanilla CSS"
  }
};
export type Translations = typeof dictionary.tr;
