import React from 'react';
import { useUserProfile } from '../core/User/useUserProfile';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';

interface UserAvatarProps {
  userId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'h-4 w-4',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export default function UserAvatar({ userId, size = 'md', className = '' }: UserAvatarProps) {
  const { profile, isLoading } = useUserProfile(userId);

  if (isLoading) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback className="animate-pulse bg-gray-200 dark:bg-gray-700">
          <div className="h-full w-full rounded-full bg-gray-300 dark:bg-gray-600" />
        </AvatarFallback>
      </Avatar>
    );
  }

  const displayName = profile?.name || userId;
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {profile?.avatar_url && (
        <AvatarImage 
          src={profile.avatar_url} 
          alt={displayName}
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
