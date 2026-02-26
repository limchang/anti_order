
import React from 'react';

interface EmojiRendererProps {
  emoji: string;
  className?: string;
  size?: number | string;
}

export const EmojiRenderer: React.FC<EmojiRendererProps> = ({ emoji, className = "", size }) => {
  const isQuadrant = ["◰", "◱", "◳", "◲"].includes(emoji);

  if (!isQuadrant) {
    // Increase size by 10% for normal emojis as requested
    const adjustedSize = typeof size === 'number' ? size * 1.1 : size;
    const style: React.CSSProperties = {
      fontFamily: '"Noto Color Emoji", sans-serif',
      fontSize: typeof adjustedSize === 'number' ? `${adjustedSize}px` : adjustedSize,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15)) drop-shadow(0px 2px 3px rgba(0,0,0,0.1))',
      WebkitFontSmoothing: 'antialiased',
      transform: 'translateZ(0)' // forces hardware acceleration for smooth shadows
    };
    return <span className={`${className} transition-transform hover:scale-105`} style={style}>{emoji}</span>;
  }

  // Custom Seat Icons that blend with the Toss design
  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size || '1em', height: size || '1em' }}>
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* The "Table" - a rounded rectangle with thinner lines as requested */}
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />

        {/* The "Seat" - a smaller rounded rectangle in the corner, filled to indicate position */}
        {emoji === "◰" && <rect x="6.5" y="6.5" width="5" height="5" rx="1.2" fill="currentColor" />}
        {emoji === "◱" && <rect x="12.5" y="6.5" width="5" height="5" rx="1.2" fill="currentColor" />}
        {emoji === "◳" && <rect x="6.5" y="12.5" width="5" height="5" rx="1.2" fill="currentColor" />}
        {emoji === "◲" && <rect x="12.5" y="12.5" width="5" height="5" rx="1.2" fill="currentColor" />}
      </svg>
    </div>
  );
};
