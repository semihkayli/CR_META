import React from 'react';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({ 
  active = false, 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-[var(--radius-pill)] px-4 py-2 font-medium transition-all duration-[var(--transition-fast)] outline-none select-none';
  
  // Custom styles are handled via inline style and CSS vars to fit the theme perfectly without Tailwind
  
  return (
    <button
      className={`${baseStyles} ${className}`}
      style={{
        backgroundColor: active 
          ? `var(--accent-${variant})` 
          : 'var(--surface-hover)',
        color: active ? '#ffffff' : 'var(--text-main)',
        border: `1px solid ${active ? 'transparent' : 'var(--border-strong)'}`,
        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      }}
      {...props}
    >
      {children}
    </button>
  );
};
