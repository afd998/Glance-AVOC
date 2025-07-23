import React from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

interface AvatarProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Generate a consistent color based on user ID
const getAvatarColor = (userId: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  
  // Simple hash function to get consistent color for same user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Generate initials from name
const getInitials = (name: string | null): string => {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ userId, size = 'md', className = '' }) => {
  const { data: userProfile, isLoading } = useUserProfile(userId);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };
  
  const displayName = userProfile?.name || 'Unknown User';
  const initials = getInitials(displayName !== 'Unknown User' ? displayName : null);
  const colorClass = getAvatarColor(userId);
  
  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClass}
          rounded-full flex items-center justify-center text-white font-medium
          ${className}
        `}
        title={displayName}
      >
        {isLoading ? (
          <div className="animate-pulse bg-white bg-opacity-30 rounded-full w-3/4 h-3/4" />
        ) : (
          initials
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {displayName}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default Avatar; 