'use client';

import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';

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

interface ProfileHeaderProps {
  playerData: {
    tag: string;
    name: string;
    expLevel: number;
    trophies: number;
    bestTrophies: number;
    wins: number;
    losses: number;
    battleCount: number;
    clan?: ClanInfo;
    currentPathOfLegendSeasonResult?: PathOfLegendResult;
  };
}

const LEAGUE_NAMES: Record<number, string> = {
  1: "Challenger I", 2: "Challenger II", 3: "Challenger III",
  4: "Master I", 5: "Master II", 6: "Master III",
  7: "Champion", 8: "Grand Champion", 9: "Royal Champion", 10: "Ultimate Champion"
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ playerData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalBattles = playerData.wins + playerData.losses;
  const winRate = totalBattles > 0 ? ((playerData.wins / totalBattles) * 100).toFixed(1) : "0.0";
  const leagueName = playerData.currentPathOfLegendSeasonResult 
    ? LEAGUE_NAMES[playerData.currentPathOfLegendSeasonResult.leagueNumber] || "Efsanevi Lig"
    : "Lig Bulunmuyor";

  return (
    <GlassCard className="mb-6 overflow-hidden transition-all duration-300">
      {/* Kompakt Görünüm (Her Zaman Açık) */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* XP Badge */}
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full shadow-sm text-white" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--cr-evo) 100%)' }}>
            <span className="text-xs font-bold leading-none">XP</span>
            <span className="text-lg font-black leading-none">{playerData.expLevel}</span>
          </div>

          <div>
            <h2 className="text-xl font-bold m-0 leading-tight" style={{ color: 'var(--text-main)' }}>
              {playerData.name}
            </h2>
            <div className="flex items-center gap-2 text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              <span className="font-medium">{playerData.tag}</span>
              {playerData.clan && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: 'var(--border-strong)' }}>
                  🛡️ {playerData.clan.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Masaüstü Hızlı Bilgiler (Mobilde gizlenir) */}
          <div className="hidden md:flex gap-6 text-right">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Kupa</div>
              <div className="font-bold text-lg leading-tight" style={{ color: 'var(--cr-gold)' }}>🏆 {playerData.trophies}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lig</div>
              <div className="font-bold text-lg leading-tight" style={{ color: 'var(--cr-evo)' }}>👑 {leagueName}</div>
            </div>
          </div>

          <span 
            className="material-symbols-outlined transition-transform duration-300"
            style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Genişletilmiş Görünüm (Accordion) */}
      <div 
        className={`grid grid-cols-2 md:grid-cols-4 gap-4 px-4 transition-all duration-300 ${isExpanded ? 'pb-4 opacity-100 border-t mt-2 pt-4' : 'opacity-0 overflow-hidden m-0 p-0'}`}
        style={{ maxHeight: isExpanded ? '500px' : '0', borderColor: 'var(--border-strong)' }}
      >
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Kazanma Oranı</div>
          <div className="text-2xl font-black" style={{ color: 'var(--accent-primary)' }}>{winRate}%</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{playerData.wins}G - {playerData.losses}M</div>
        </div>
        
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Toplam Maç</div>
          <div className="text-2xl font-black" style={{ color: 'var(--text-main)' }}>{playerData.battleCount}</div>
        </div>

        <div className="p-3 rounded-xl md:hidden" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Mevcut Kupa</div>
          <div className="text-2xl font-black" style={{ color: 'var(--cr-gold)' }}>{playerData.trophies}</div>
        </div>

        <div className="p-3 rounded-xl md:hidden" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Mevcut Lig</div>
          <div className="text-lg font-black leading-tight" style={{ color: 'var(--cr-evo)' }}>{leagueName}</div>
        </div>

        <div className="p-3 rounded-xl col-span-2 md:col-span-2 flex items-center justify-center text-sm italic border-dashed border" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-muted)', borderColor: 'var(--border-strong)' }}>
          "Koleksiyon analizi arka planda çalışıyor, desteler sana özel filtreleniyor..."
        </div>
      </div>
    </GlassCard>
  );
};
