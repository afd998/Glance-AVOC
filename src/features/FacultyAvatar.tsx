import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface FacultyAvatarProps {
  imageUrl: string;
  cutoutImageUrl?: string | null; // Pre-processed cutout image URL (can be null from database)
  instructorName: string;
  isHovering: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  maskRadius?: number; // Configurable radius for the circular mask (default: 50)
  priority?: boolean; // For above-the-fold images
}

interface MultipleFacultyAvatarsProps {
  instructorNames: string[];
  isHovering: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  maxAvatars?: number; // Maximum number of avatars to show
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
  maskRadius = 63, // Default radius of 50, can be adjusted (smaller = tighter mask, larger = looser mask)
  priority = false // For above-the-fold images
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

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-purple-200 flex items-center justify-center ${className}`} title={instructorName}>
        <span className="text-sm transition-all duration-200 ease-in-out">👤</span>
      </div>
    );
  }

  // If we have a cutout image, use the SVG with cutout effects
  if (hasCutout) {
    return (
      <div className={`relative ${sizeClasses[size]} transition-all duration-300 ease-in-out ${className}`} style={{ overflow: 'visible' }} title={instructorName}>
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

        {/* Foreground layer with cutout image and effects */}
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
                <path d="M -13 -40 L 113 -40 L 113 50 A 63 63 0 0 1 -13 50 Z" />
              </clipPath>
              <clipPath id="maskBackground" clipPathUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="63" />
              </clipPath>
            </defs>
            
            {/* Cutout image with original portrait-style clipping */}
            <g 
              clipPath="url(#maskImage)"
              transform={isHovering ? "translate(0 8)" : "translate(0 10)"}
              className="transition-all duration-300 ease-in-out"
            >
              {/* Cutout image with purple tint and scaling effects */}
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
                onError={handleImageError}
              />
            </g>
          </svg>
        </div>
      </div>
    );
  }

  // Regular image rendering with purple tint and hover effects (fallback for no cutout)
  if (imageUrl) {
    return (
      <div className={`relative ${sizeClasses[size]} transition-all duration-300 ease-in-out ${className}`} title={instructorName}>
        {/* Purple gradient background */}
        <div 
          className="absolute inset-0 rounded-full z-0" 
          style={{ 
            background: 'linear-gradient(135deg, #6b5b95 0%, #886ec4 50%, #9b8ce8 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        
        {/* Regular image with purple tint and hover effects */}
        <div className="absolute inset-0 z-10 rounded-full overflow-hidden">
          <img
            src={imageUrl}
            alt={instructorName}
            className={`w-full h-full object-cover rounded-full transition-all duration-300 ease-in-out ${
              isHovering ? 'scale-110 brightness-110' : 'scale-100'
            }`}
            style={{
              filter: isHovering 
                ? 'brightness(1.1) saturate(1.2) hue-rotate(10deg) contrast(1.1)' 
                : 'brightness(0.9) saturate(1.1) hue-rotate(5deg) contrast(1.05)',
              mixBlendMode: 'multiply'
            }}
            onError={handleImageError}
          />
        </div>
        
        {/* Purple overlay for tint effect */}
        <div 
          className="absolute inset-0 z-15 rounded-full transition-all duration-300 ease-in-out"
          style={{
            background: isHovering 
              ? 'linear-gradient(135deg, rgba(139, 110, 196, 0.3) 0%, rgba(155, 140, 232, 0.4) 50%, rgba(107, 91, 149, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(139, 110, 196, 0.2) 0%, rgba(155, 140, 232, 0.3) 50%, rgba(107, 91, 149, 0.15) 100%)',
            mixBlendMode: 'overlay'
          }}
        ></div>
        
        {/* Halloween green glow effect */}
        {isHalloweenTheme && isHovering && (
          <div 
            className="absolute inset-0 rounded-full z-20 animate-pulse" 
            style={{ 
              background: 'radial-gradient(circle, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.1) 50%, transparent 100%)',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.6), 0 0 40px rgba(0, 255, 0, 0.4), 0 0 60px rgba(0, 255, 0, 0.2)',
              filter: 'blur(1px)'
            }}
          ></div>
        )}
      </div>
    );
  }

  // Fallback for when no image URL is provided
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-purple-200 flex items-center justify-center ${className}`} title={instructorName}>
      <span className="text-sm transition-all duration-200 ease-in-out">👤</span>
    </div>
  );
}

// New component to handle multiple instructor avatars
export function MultipleFacultyAvatars({
  instructorNames,
  isHovering,
  className = '',
  size = 'md',
  maxAvatars = 3
}: MultipleFacultyAvatarsProps) {
  const { currentTheme } = useTheme();

  // If no instructors, return null
  if (!instructorNames || instructorNames.length === 0) {
    return null;
  }

  // If only one instructor, use a simple avatar
  if (instructorNames.length === 1) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-purple-200 flex items-center justify-center ${className}`} title={instructorNames[0]}>
        <span className="text-sm transition-all duration-200 ease-in-out">👤</span>
      </div>
    );
  }

  // For multiple instructors, show up to maxAvatars
  const displayNames = instructorNames.slice(0, maxAvatars);
  const remainingCount = instructorNames.length - maxAvatars;

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  };

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayNames.map((name, index) => (
        <div
          key={`${name}-${index}`}
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-medium shadow-sm transition-all duration-200 ${
            isHovering ? 'scale-110 shadow-md' : ''
          }`}
          title={name}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gray-400 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-medium shadow-sm transition-all duration-200 ${
            isHovering ? 'scale-110 shadow-md' : ''
          }`}
          title={`+${remainingCount} more instructor${remainingCount > 1 ? 's' : ''}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
