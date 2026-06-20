'use client';

import React, { useState } from 'react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { FilterBar } from '@/components/filters/FilterBar';
import { DeckList } from '@/components/deck/DeckList';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useDeckMatcher } from '@/utils/useDeckMatcher';
import { PillButton } from '@/components/ui/PillButton';

// Veriler (Gerçek API/DB kullanımları bu şekilde import edilir)
import metaDecksData from '@/data/meta_decks.json';
import previousSeasonDecksData from '@/data/previous_season_decks.json';

export default function HomePage() {
  const [playerTag, setPlayerTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<any | null>(null);
  
  const [deckSource, setDeckSource] = useState<'meta' | 'pro'>('meta');
  const [season, setSeason] = useState<'active' | 'prev'>('active');

  const sourceData = season === 'active' ? metaDecksData : previousSeasonDecksData;
  const rawDecks = deckSource === 'meta' ? sourceData.metaDecks : sourceData.proDecks;

  // Akıllı eşleştirme hook'u
  const { filters, updateFilters, matchedDecks } = useDeckMatcher({
    playerCards: playerData ? playerData.cards : [],
    metaDecks: rawDecks as any
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedTag = playerTag.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleanedTag) {
      setError('Lütfen geçerli bir oyuncu etiketi girin.');
      return;
    }

    setLoading(true);
    setError(null);
    updateFilters({ evoTolerance: 0, heroTolerance: 0, cardTolerance: 0, requiredCardId: null, sortBy: 'recommended' });

    try {
      const response = await fetch(`/api/player/${cleanedTag}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Oyuncu bulunamadı.');
      setPlayerData(data);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)', borderColor: 'var(--border-strong)' }}>
        <div className="container h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Başlık */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black" style={{ backgroundImage: 'linear-gradient(to bottom right, var(--accent-primary), var(--cr-evo))' }}>
              CR
            </div>
            <span className="font-bold text-lg hidden md:block" style={{ fontFamily: 'var(--font-title)' }}>
              Meta<span className="font-medium" style={{ color: 'var(--text-muted)' }}>Matcher</span>
            </span>
          </div>

          {/* Arama Çubuğu */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative flex items-center">
            <span className="absolute left-4 font-bold" style={{ color: 'var(--text-muted)' }}>#</span>
            <input 
              type="text"
              placeholder="Oyuncu Etiketi (Örn: G9YV9GR8R)"
              value={playerTag}
              onChange={(e) => setPlayerTag(e.target.value)}
              className="w-full rounded-full py-2 pl-8 pr-12 text-sm font-medium transition-colors outline-none border"
              style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-1 top-1 bottom-1 w-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 text-white"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">search</span>
              )}
            </button>
          </form>

          {/* Dil & Tema */}
          <div className="flex items-center gap-2">
            <button 
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-xs border transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
              onClick={() => {
                alert("Dil altyapısı bu versiyonda entegre edilmemiştir, yakında Türkçe/İngilizce desteği gelecektir.");
              }}
              title="Dil Değiştir (Yakında)"
            >
              TR
            </button>
            <ThemeToggle />
          </div>

        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 container py-8">
        
        {/* Hata Mesajı */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Profil Özeti (Sadece oyuncu aratılmışsa) */}
        {playerData && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <ProfileHeader playerData={playerData} />
          </div>
        )}

        {/* Sekmeler ve Filtreler */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 mt-4">
          
          {/* Kaynak Değiştirici (Segmented Control) */}
          <div className="flex p-1 rounded-full border inline-flex self-start" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-strong)' }}>
            <button 
              onClick={() => setDeckSource('meta')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${deckSource === 'meta' ? 'shadow-sm' : ''}`}
              style={deckSource === 'meta' ? { backgroundColor: 'var(--surface-card)', color: 'var(--accent-primary)' } : { color: 'var(--text-muted)' }}
            >
              Sezon Metası
            </button>
            <button 
              onClick={() => setDeckSource('pro')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${deckSource === 'pro' ? 'shadow-sm' : ''}`}
              style={deckSource === 'pro' ? { backgroundColor: 'var(--surface-card)', color: 'var(--accent-primary)' } : { color: 'var(--text-muted)' }}
            >
              E-Sporcu Desteleri
            </button>
          </div>

          <div className="text-sm font-bold px-3 py-1 rounded-full border" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}>
            {matchedDecks.length} Deste Eşleşti
          </div>
        </div>

        {/* Dinamik Filtre Çubuğu (Sadece oyuncu verisi varsa gösterilir, simülasyon içindir) */}
        {playerData && (
          <div className="animate-in fade-in duration-500 delay-150 fill-mode-forwards opacity-0">
            <FilterBar filters={filters} onChange={updateFilters} />
          </div>
        )}

        {!playerData && (
          <div className="text-sm mb-6 mt-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="material-symbols-outlined text-lg" style={{ color: 'var(--cr-gold)' }}>info</span>
            Kart seviyelerine ve evrimlere göre simülasyon yapmak için lütfen önce profilinizi aratın. Tüm meta desteleri filtrelenmeden listelenmektedir.
          </div>
        )}

        {/* Deste Listesi */}
        <div className="mt-4">
          <DeckList decks={matchedDecks} />
        </div>

      </main>
    </div>
  );
}
