import React from 'react';
import { OptimizedImage } from './OptimizedImage';

interface SimpleFacultyAvatarProps {
  imageUrl: string;
  instructorName: string;
  isHovering: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean; // For above-the-fold images
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16'
};

export function SimpleFacultyAvatar({ 
  imageUrl, 
  instructorName, 
  isHovering, 
  className = '',
  size = 'md',
  priority = false
}: SimpleFacultyAvatarProps) {
  return (
    <div className={`relative ${sizeClasses[size]} transition-all duration-300 ease-out ${className}`} title={instructorName}>
      {/* Background layer - original image contained within circle */}
      <div className="absolute inset-0 rounded-full overflow-hidden z-10">
        <OptimizedImage
          src={imageUrl}
          alt={instructorName}
          className={`${sizeClasses[size]} rounded-full object-cover transition-all duration-300 ease-out ${
            isHovering 
              ? 'scale-110 opacity-100' 
              : 'scale-100 opacity-80'
          }`}
          style={{
            filter: 'grayscale(1)'
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
          priority={priority}
        />
        {/* Purple overlay on background */}
        <div className="absolute inset-0 rounded-full bg-[#886ec4] mix-blend-overlay opacity-30"></div>
      </div>

      {/* Foreground layer - CSS head isolation that can overflow ONLY at the top */}
      <div 
        className="absolute inset-0 z-20"
        style={{
          // Container that allows overflow only at the top
          clipPath: 'inset(0 0 50% 0)', // Only show top 50% of container
          overflow: 'visible'
        }}
      >
        <OptimizedImage
          src={imageUrl}
          alt={instructorName}
          className={`${sizeClasses[size]} object-cover transition-all duration-300 ease-out ${
            isHovering 
              ? 'opacity-100 scale-125' 
              : 'opacity-0 scale-100'
          }`}
          style={{
            filter: 'grayscale(0) contrast(1.2) brightness(1.1) saturate(1.1)',
            transformOrigin: 'center top', // Scale from top, not center
            // Head isolation - only show center head area
            clipPath: 'circle(35% at 50% 40%)', // Circular crop focused on face
            // Additional mask for smoother edges
            mask: `
              radial-gradient(
                circle 30% at 50% 40%, 
                black 60%, 
                rgba(0,0,0,0.9) 75%, 
                rgba(0,0,0,0.4) 90%, 
                transparent 100%
              )
            `
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
          priority={priority}
        />
      </div>
    </div>
  );
}
