import React from 'react';
import Avatar from '../Avatar';
import { useUserProfile } from '../../hooks/useUserProfile';

interface OwnerDisplayProps {
  owner1: string;
  owner2?: string | null;
  handOffTime?: string | null;
}

// Helper function to format hand-off time
const formatHandOffTime = (timeString: string): string => {
  if (!timeString) return '';
  try {
    // Parse HH:MM format
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting hand-off time:', timeString, error);
    return timeString || '';
  }
};

export default function OwnerDisplay({ owner1, owner2, handOffTime }: OwnerDisplayProps) {
  const hasTwoOwners = owner2 && owner1 !== owner2;
  
  // Get user profiles for tooltips
  const { data: owner1Profile } = useUserProfile(owner1);
  const { data: owner2Profile } = useUserProfile(owner2 || '');
  
  return (
    <div className="mb-3 sm:mb-4">
      {/* "Assigned to:" text */}
      <div className="mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Assigned to:
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* First Owner Avatar with Tooltip */}
        <div className="relative group">
          <Avatar userId={owner1} size="md" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {owner1Profile?.name || owner1}
          </div>
        </div>
        
        {/* Arrow and Second Owner - Only show if there are two different owners */}
        {hasTwoOwners && (
          <>
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="relative group">
              <Avatar userId={owner2} size="md" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {owner2Profile?.name || owner2}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Hand-off Time Text - Only show if there are two different owners and hand-off time */}
      {hasTwoOwners && handOffTime && (
        <div className="mt-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Hand-off at {formatHandOffTime(handOffTime)}
          </span>
        </div>
      )}
    </div>
  );
} 