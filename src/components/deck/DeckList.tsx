import React from 'react';
import { DeckCard, DeckData } from './DeckCard';

interface DeckListProps {
  decks: DeckData[];
}

export const DeckList: React.FC<DeckListProps> = ({ decks }) => {
  if (!decks || decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)]">
        <span className="material-symbols-outlined mb-4" style={{ fontSize: '48px', opacity: 0.5 }}>
          search_off
        </span>
        <h3 className="text-xl font-bold mb-2 text-[var(--text-main)]">Deste Bulunamadı</h3>
        <p>Mevcut kart koleksiyonunuza ve seçtiğiniz filtrelere uyan bir meta destesi bulunamadı. Lütfen filtreleri esnetin (Örn: "1 Evrim Açabilirim" seçeneğini aktif edin).</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
      {decks.map((deck, idx) => (
        <div 
          key={`${deck.deckId}-${idx}`} 
          style={{ 
            animationDelay: `${idx * 50}ms`,
            opacity: 0,
            animation: `fadeInUp 0.5s ease-out ${idx * 0.05}s forwards` 
          }}
        >
          <DeckCard deck={deck} title={`Meta Deste #${idx + 1}`} />
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};
