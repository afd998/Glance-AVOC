import React, { useState } from 'react';
import { SimpleFacultyAvatar } from './SimpleFacultyAvatar';
import { useTheme } from '../contexts/ThemeContext';

interface FacultyAvatarProps {
  imageUrl: string;
  cutoutImageUrl?: string | null; // Pre-processed cutout image URL (can be null from database)
  instructorName: string;
  isHovering: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  maskRadius?: number; // Configurable radius for the circular mask (default: 50)
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16'
};

export function FacultyAvatar({ 
  imageUrl, 
  cutoutImageUrl,
  instructorName, 
  isHovering, 
  className = '',
  size = 'md',
  maskRadius = 63 // Default radius of 50, can be adjusted (smaller = tighter mask, larger = looser mask)
}: FacultyAvatarProps) {
  const { currentTheme } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Check if we have a valid cutout image
  const hasCutout = cutoutImageUrl && typeof cutoutImageUrl === 'string' && cutoutImageUrl.length > 0;
  
  // Halloween theme detection
  const isHalloweenTheme = currentTheme.name === 'Halloween';

  const handleImageError = () => {
    setImageError(true);
  };

  // If no cutout available, use simple CSS avatar
  if (!hasCutout) {
    return (
      <SimpleFacultyAvatar
        imageUrl={imageUrl}
        instructorName={instructorName}
        isHovering={isHovering}
        className={className}
        size={size}
      />
    );
  }

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-purple-200 flex items-center justify-center ${className}`}>
        <span className="text-sm transition-all duration-200 ease-in-out">👤</span>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} transition-all duration-300 ease-in-out ${className}`} style={{ overflow: 'visible' }}>
      {/* Purple gradient background */}
      <div 
        className="absolute inset-0 rounded-full z-0" 
        style={{ 
          background: 'linear-gradient(135deg, #6b5b95 0%, #886ec4 50%, #9b8ce8 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      
      {/* Halloween green glow effect */}
      {isHalloweenTheme && isHovering && (
        <div 
          className="absolute inset-0 rounded-full z-10 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.1) 50%, transparent 100%)',
            boxShadow: '0 0 20px rgba(0, 255, 0, 0.6), 0 0 40px rgba(0, 255, 0, 0.4), 0 0 60px rgba(0, 255, 0, 0.2)',
            filter: 'blur(1px)'
          }}
        ></div>
      )}

      {/* Foreground layer - Clean SVG structure */}
      <div className="absolute inset-0 z-20" style={{ overflow: 'visible' }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 -10 100 130" 
          className="w-full h-full transition-all duration-300 ease-in-out"
          style={{
            overflow: 'visible'
          }}
        >
          <defs>
            <clipPath id="maskImage" clipPathUnits="userSpaceOnUse">
              <path d={`M ${50 - maskRadius} -40 L ${50 + maskRadius} -40 L ${50 + maskRadius} 50 A ${maskRadius} ${maskRadius} 0 0 1 ${50 - maskRadius} 50 Z`} />
            </clipPath>
            <clipPath id="maskBackground" clipPathUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r={maskRadius} />
            </clipPath>
          </defs>
          
          <g 
            clipPath="url(#maskImage)" 
            transform={isHovering ? "translate(0 8)" : "translate(0 10)"}
            className="transition-all duration-300 ease-in-out"
          >
            {/* Foreground image with purple tint */}
            <image 
              width="120" 
              height="144" 
              x="-15" 
              y="0" 
              fill="none" 
              className="transition-all duration-300 ease-in-out"
              style={{
                transformOrigin: '50% 50%',
                transform: isHovering 
                  ? 'translateY(-30px) scale(1.7)' 
                  : 'translateY(-30px) scale(1.5)',
                filter: isHovering 
                  ? isHalloweenTheme
                    ? 'sepia(1) hue-rotate(120deg) saturate(1.5) brightness(1.2) contrast(1.3) drop-shadow(0 0 10px rgba(0, 255, 0, 0.8))'
                    : 'sepia(1) hue-rotate(240deg) saturate(0.8) brightness(0.9) contrast(1.2)'
                  : 'sepia(1) hue-rotate(240deg) saturate(0.8) brightness(0.7) contrast(1.2)'
              }}
              href={cutoutImageUrl}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
