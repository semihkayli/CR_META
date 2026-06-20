'use client';

import React from 'react';
import { PillButton } from '../ui/PillButton';
import { MatchFilters, SortOption } from '@/services/deckMatcher';

interface FilterBarProps {
  filters: MatchFilters;
  onChange: (newFilters: MatchFilters) => void;
  availableCards?: { id: number; name: string }[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {

  const toggleTolerance = (key: keyof MatchFilters) => {
    const currentValue = filters[key] as number;
    const nextValue = currentValue >= 2 ? 0 : currentValue + 1;
    onChange({ ...filters, [key]: nextValue });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, sortBy: e.target.value as SortOption });
  };

  const hasActiveFilters = filters.evoTolerance > 0 || filters.heroTolerance > 0 || filters.cardTolerance > 0 || filters.requiredCardId !== null;

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Kaydırılabilir Pill Çubuğu */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        {/* Evo Toleransı */}
        <PillButton 
          active={filters.evoTolerance > 0}
          onClick={() => toggleTolerance('evoTolerance')}
          className="flex-shrink-0 text-sm"
        >
          {filters.evoTolerance === 0 ? 'Evrim Gerekli' : `Evrim: +${filters.evoTolerance} Tolerans`}
        </PillButton>

        {/* Hero Toleransı */}
        <PillButton 
          active={filters.heroTolerance > 0}
          onClick={() => toggleTolerance('heroTolerance')}
          className="flex-shrink-0 text-sm"
        >
          {filters.heroTolerance === 0 ? 'Hero Gerekli' : `Hero: +${filters.heroTolerance} Tolerans`}
        </PillButton>

        {/* Kart Toleransı */}
        <PillButton 
          active={filters.cardTolerance > 0}
          onClick={() => toggleTolerance('cardTolerance')}
          className="flex-shrink-0 text-sm"
        >
          {filters.cardTolerance === 0 ? 'Tam Kart Eşleşmesi' : `Eksik Kart: +${filters.cardTolerance}`}
        </PillButton>

        {/* Sıralama Seçici (Select'i Pill gibi gösteriyoruz) */}
        <div className="relative flex-shrink-0">
          <select 
            value={filters.sortBy}
            onChange={handleSortChange}
            className="appearance-none border text-sm font-medium rounded-full px-4 py-2 pr-8 outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
          >
            <option value="recommended">Önerilen (Rating)</option>
            <option value="mostPlayed">En Çok Oynanan</option>
            <option value="highestWinRate">Kazanma Oranı</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
            expand_more
          </span>
        </div>
      </div>

      {/* Temizle Butonu (Aktif filtre varsa görünür) */}
      <div className="flex justify-end h-8">
        <div className={`transition-all duration-300 ${hasActiveFilters ? 'opacity-100 transform translate-y-0' : 'opacity-0 pointer-events-none'}`}>
          <button 
            onClick={() => onChange({ evoTolerance: 0, heroTolerance: 0, cardTolerance: 0, requiredCardId: null, sortBy: 'recommended' })}
            className="text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full border"
            style={{ color: 'var(--cr-elixir)', backgroundColor: 'rgba(236,72,153,0.1)', borderColor: 'rgba(236,72,153,0.2)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
            Filtreleri Temizle
          </button>
        </div>
      </div>
    </div>
  );
};
