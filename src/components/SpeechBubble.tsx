import React from 'react';

interface SpeechBubbleProps {
  message: string;
  isVisible: boolean;
  className?: string;
}

export function SpeechBubble({ message, isVisible, className = '' }: SpeechBubbleProps) {
  if (!isVisible) return null;

  return (
    <div className={`absolute z-50 pointer-events-none ${className}`}>
      {/* Speech bubble with connected tail */}
      <div 
        className="relative bg-white border-2 border-black rounded-lg px-3 py-2 shadow-lg"
        style={{
          borderRadius: '0.4em',
          transition: 'none',
          transform: 'none !important',
          scale: '1 !important'
        }}
      >
        <p className="text-xs font-bold text-black text-center leading-tight">
          {message}
        </p>
        
        {/* Tail pointing down */}
        <div 
          className="absolute"
          style={{
            bottom: '8px',
            left: '10%',
            width: 0,
            height: 0,
            border: '20px solid transparent',
            borderTopColor: '#ffffff',
            borderBottom: 0,
            marginLeft: '-20px',
            marginBottom: '-20px'
          }}
        />
        
        {/* Tail border */}
        <div 
          className="absolute"
          style={{
            bottom: '8px',
            left: '10%',
            width: 0,
            height: 0,
            border: '22px solid transparent',
            borderTopColor: '#000000',
            borderBottom: 0,
            marginLeft: '-22px',
            marginBottom: '-22px',
            zIndex: -1
          }}
        />
      </div>
    </div>
  );
}
