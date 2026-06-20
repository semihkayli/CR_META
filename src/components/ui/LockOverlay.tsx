import React from 'react';

interface LockOverlayProps {
  type: 'evo' | 'hero' | 'card';
  message?: string;
}

export const LockOverlay: React.FC<LockOverlayProps> = ({ type, message }) => {
  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 10,
        borderRadius: 'inherit'
      }}
    >
      <span 
        className="material-symbols-outlined" 
        style={{ 
          fontSize: '24px', 
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        lock
      </span>
    </div>
  );
};
