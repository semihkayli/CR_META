'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { CRCardImage } from './CRCardImage';
import { LockOverlay } from '../ui/LockOverlay';
import { getAverageElixir } from '@/utils/cardHelpers';

interface MetaCard {
  name: string;
  id: number;
  evolutionLevel?: number;
  iconUrls: { medium: string };
}

export interface DeckData {
  deckId: string;
  cards: MetaCard[];
  winRate: number;
  useCount: number;
  playerName?: string;
  playerTag?: string;
  slotConfig?: {
    evoSlotCardId: number;
    championSlotCardId: number;
    flexSlotCardId: number | null;
    flexSlotType: 'evolution' | 'champion' | null;
  };
  
  isFullyMatch?: boolean;
  missingCardIds?: number[];
  missingEvoIds?: number[];
  missingHeroIds?: number[];
}

interface DeckCardProps {
  deck: DeckData;
  title?: string;
}

export const DeckCard: React.FC<DeckCardProps> = ({ deck, title }) => {
  const cardIds = deck.cards.map(c => c.id).join(';');
  const copyUrl = `https://link.clashroyale.com/deck/tr?deck=${cardIds}`;

  const isMatchedMode = deck.isFullyMatch !== undefined;
  const missingCardIds = deck.missingCardIds || [];
  const missingEvoIds = deck.missingEvoIds || [];
  const missingHeroIds = deck.missingHeroIds || [];

  const avgElixir = getAverageElixir(deck.cards as any);
  
  const deckTitle = deck.playerName ? deck.playerName : (title || 'Meta Deste');
  const subtitle = deck.playerName ? 'E-Sporcu Destesi' : 'Popüler Sezon Metası';
  const winRateHigh = deck.winRate >= 55;

  return (
    <GlassCard hoverable className="flex flex-col h-full overflow-hidden">
      {/* Üst Bilgi Başlığı */}
      <div className="p-3 flex justify-between items-center border-b" style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--surface-hover)' }}>
        <h3 className="text-base font-bold m-0 leading-none" style={{ fontFamily: 'var(--font-title)', color: 'var(--text-main)' }}>
          {deckTitle}
        </h3>
        
        {/* Kazanma Oranı Hapı */}
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-sm"
          style={{
            backgroundColor: winRateHigh ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-hover)',
            color: winRateHigh ? '#10B981' : 'var(--text-main)',
            border: `1px solid ${winRateHigh ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-strong)'}`
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {winRateHigh ? 'trending_up' : 'bar_chart'}
          </span>
          {deck.winRate}% WR
        </div>
      </div>

      {/* 8'li Kart Izgarası (Kompakt) */}
      <div className="p-2 grid grid-cols-4 gap-1 flex-grow" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {deck.cards.map((card) => {
          // SLOT MANTIĞI DÜZELTMESİ
          const sc = deck.slotConfig;
          const isSlotEvo = sc && (card.id === sc.evoSlotCardId || (sc.flexSlotType === 'evolution' && card.id === sc.flexSlotCardId));
          const isSlotHero = sc && (card.id === sc.championSlotCardId || (sc.flexSlotType === 'champion' && card.id === sc.flexSlotCardId));
          
          // Fallback if no slotConfig (old data): check evolutionLevel, but only first 2 max
          const isLegacyEvo = !sc && card.evolutionLevel && card.evolutionLevel > 0;
          const isEvo = isSlotEvo || isLegacyEvo;
          const isHero = isSlotHero;

          const isCardMissing = missingCardIds.includes(card.id);
          const isEvoMissing = missingEvoIds.includes(card.id);
          const isHeroMissing = missingHeroIds.includes(card.id);
          const isAnyMissing = isCardMissing || isEvoMissing || isHeroMissing;

          return (
            <div 
              key={card.id} 
              className="relative aspect-[3/4] rounded-lg overflow-hidden flex items-center justify-center transition-transform hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--surface-hover)',
                border: isEvo ? '2px solid var(--cr-evo)' : isHero ? '2px solid var(--cr-gold)' : '1px solid var(--border-strong)',
                boxShadow: isEvo ? '0 0 10px rgba(139, 92, 246, 0.2)' : isHero ? '0 0 10px rgba(245, 158, 11, 0.2)' : 'none'
              }}
            >
              <CRCardImage 
                cardId={card.id} 
                cardName={card.name} 
                iconUrl={card.iconUrls?.medium}
                className={isAnyMissing ? 'grayscale-locked' : ''} 
              />
              
              {/* Eksik Kilit Örtüsü */}
              {isAnyMissing && (
                <LockOverlay 
                  type={isEvoMissing ? 'evo' : isHeroMissing ? 'hero' : 'card'} 
                  message={isEvoMissing ? 'EVO GEREKLİ' : isHeroMissing ? 'HERO GEREKLİ' : 'KART GEREKLİ'} 
                />
              )}

              {/* Var Olan Evo Logosu */}
              {isEvo && !isEvoMissing && (
                <div 
                  className="absolute top-0 left-0 text-[10px] font-black px-1.5 py-0.5 rounded-br-lg shadow-sm z-10"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--cr-evo), #d946ef)', 
                    color: '#fff',
                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)'
                  }}
                >
                  EVO
                </div>
              )}
              
              {/* Kahraman (Hero) Logosu */}
              {isHero && !isHeroMissing && (
                <div 
                  className="absolute top-0 left-0 text-[10px] font-black px-1.5 py-0.5 rounded-br-lg shadow-sm z-10 flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, #FDE68A, var(--cr-gold))', 
                    color: '#78350F',
                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '12px', fontWeight: 'bold' }}>crown</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alt Kontrol ve Kopyalama */}
      <div className="p-4 border-t border-[var(--border-strong)] flex flex-col gap-3 mt-auto">
        
        {/* İksir ve Maç Sayısı */}
        <div className="flex justify-between items-center text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] px-2 py-1 rounded-lg">
            <span className="material-symbols-outlined text-[var(--cr-elixir)]" style={{ fontSize: '16px' }}>
              water_drop
            </span>
            {avgElixir}
          </div>
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] px-2 py-1 rounded-lg text-[var(--text-muted)] font-medium text-xs">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              sports_esports
            </span>
            {deck.useCount}
          </div>
        </div>

        {/* Kopyala Butonu */}
        <a 
          href={copyUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all text-white active:scale-95 shadow-md"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
          Oyuna Kopyala
        </a>
      </div>
    </GlassCard>
  );
};
