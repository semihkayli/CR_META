import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  hoverable = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] transition-all duration-[var(--transition-normal)]';
  const hoverStyles = hoverable ? 'hover:shadow-[var(--shadow-medium)] hover:-translate-y-1' : '';
  
  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-soft)',
        transition: 'all var(--transition-normal)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};
