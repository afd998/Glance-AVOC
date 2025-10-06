"use client"
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "src/lib/utils"
import { useUserProfile } from "../../core/User/useUserProfile"

// Generate a consistent color based on user ID
const generateUserColor = (userId: string): string => {
  // Create a simple hash from the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to select from a predefined set of colors (hex values)
  const colors = [
    '#ef4444', // red-500
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#eab308', // yellow-500
    '#8b5cf6', // purple-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#06b6d4', // cyan-500
    '#10b981', // emerald-500
    '#8b5cf6', // violet-500
    '#f43f5e', // rose-500
    '#f59e0b', // amber-500
    '#84cc16', // lime-500
    '#0ea5e9'  // sky-500
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  userId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

function Avatar({
  className,
  userId,
  size = 'md',
  ...props
}: AvatarProps) {
  const sizeClasses = {
    xs: 'size-4',
    sm: 'size-6', 
    md: 'size-8',
    lg: 'size-12'
  };

  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

// UserAvatar component that automatically displays user initials
interface UserAvatarProps {
  userId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

function UserAvatar({ userId, size = 'md', className = '' }: UserAvatarProps) {
  const { data: profile, isLoading } = useUserProfile(userId);

  if (isLoading) {
    return (
      <Avatar className={className} size={size}>
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

  const userColor = generateUserColor(userId);
  
  // Debug: log the color being used
  console.log(`User ${userId} getting color: ${userColor}`);

  return (
    <Avatar className={className} size={size}>
      <AvatarFallback 
        className="text-white font-medium flex items-center justify-center bg-transparent" 
        style={{ 
          backgroundColor: userColor,
          fontSize: size === 'xs' ? '8px' : size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px' 
        }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar }
export default Avatar
