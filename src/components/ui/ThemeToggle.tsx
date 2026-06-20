'use client';

import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Component mount olduğunda mevcut temayı html elementinden oku
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)]"
      style={{
        backgroundColor: 'var(--surface-hover)',
        color: 'var(--text-main)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        border: '1px solid var(--border-strong)'
      }}
      aria-label="Temayı Değiştir"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
};
