'use client';

import React, { useState } from 'react';

interface CRCardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  cardId: number | string;
  cardName: string;
  iconUrl?: string;
}

export const CRCardImage: React.FC<CRCardImageProps> = ({ cardId, cardName, iconUrl, className = '', style, ...props }) => {
  const [imgSrc, setImgSrc] = useState(iconUrl || `https://cdn.royaleapi.com/static/img/cards/150/${cardId}.png`);
  const [hasError, setHasError] = useState(false);
  
  const handleError = () => {
    // Eğer yerel fallback de başarısız olursa, çirkin kırık resim yerine yazılı siyah kutu göster.
    if (imgSrc === `/images/cards/${cardId}.png`) {
      setHasError(true);
    } else {
      setImgSrc(`/images/cards/${cardId}.png`);
    }
  };

  if (hasError) {
    return (
      <div 
        className={`w-full h-full flex flex-col items-center justify-center text-center p-1 ${className}`}
        style={{ backgroundColor: '#111827', color: '#9CA3AF', ...style }}
      >
        <span className="text-[10px] font-bold leading-tight uppercase">{cardName}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={cardName}
      onError={handleError}
      className={`w-full h-full object-cover ${className}`}
      style={{
        ...style,
        position: 'relative',
        zIndex: 1,
      }}
      {...props}
    />
  );
};
