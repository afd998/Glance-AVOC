import React, { useState } from 'react';
import { useOwnerDisplay } from '../../hooks/useOwnerDisplay';
import { useHandOffTime } from '../../hooks/useHandOffTime';
import Avatar from '../Avatar';
import UserSelectionModal from '../UserSelectionModal';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface OwnerDisplayProps {
  event: Event;
  isHandOffTimeLoading: boolean;
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

export default function OwnerDisplay({ event, isHandOffTimeLoading }: OwnerDisplayProps) {
  const { data: handOffTime } = useHandOffTime(event);
  const {
    owner1,
    owner2,
    owner1Profile,
    owner2Profile,
    hasTwoOwners,
    isOwner1FromManOwner,
    isOwner2FromManOwner,
    handleUserSelect: updateOwner,
    handleClearOwner
  } = useOwnerDisplay(event);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<'man_owner' | 'man_owner_2' | null>(null);

  const handleAvatarClick = (ownerType: 'man_owner' | 'man_owner_2') => {
    setEditingOwner(ownerType);
    setIsModalOpen(true);
  };

  const handleUserSelect = (userId: string) => {
    if (!editingOwner) return;
    updateOwner(editingOwner, userId);
  };

  // Don't render if no owners and no handoff time
  if (!owner1 && !owner2 && !handOffTime) {
    return null;
  }

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
        {owner1 && (
          <div className="relative group">
            <button
              onClick={() => handleAvatarClick('man_owner')}
              className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
            >
              <Avatar userId={owner1} size="md" />
                             {/* Show indicator if displaying from auto-assigned owner */}
               {!isOwner1FromManOwner && (
                 <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border border-white dark:border-gray-800"></div>
               )}
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {owner1Profile?.name || owner1}
              <div className="text-xs text-gray-300 mt-1">
                {isOwner1FromManOwner ? 'Click to change' : 'Click to override auto-assignment'}
              </div>
            </div>
            <button
              onClick={() => handleClearOwner('man_owner')}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              title="Clear owner"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Show empty avatar for first owner if no primary owner */}
        {!owner1 && (
          <div className="relative group">
            <button
              onClick={() => handleAvatarClick('man_owner')}
              className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-400 dark:border-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Assign initial owner
              <div className="text-xs text-gray-300 mt-1">Click to assign</div>
            </div>
          </div>
        )}
        
        {/* Arrow and Second Owner - Show if there's a second owner or handoff time */}
        {(owner2 || handOffTime) && (
          <>
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {owner2 ? (
              <div className="relative group">
                <button
                  onClick={() => handleAvatarClick('man_owner_2')}
                  className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
                >
                  <Avatar userId={owner2} size="md" />
                                     {/* Show indicator if displaying from auto-assigned owner */}
                   {!isOwner2FromManOwner && (
                     <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border border-white dark:border-gray-800"></div>
                   )}
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {owner2Profile?.name || owner2}
                  <div className="text-xs text-gray-300 mt-1">
                    {isOwner2FromManOwner ? 'Click to change' : 'Click to override auto-assignment'}
                  </div>
                </div>
                <button
                  onClick={() => handleClearOwner('man_owner_2')}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  title="Clear owner"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="relative group">
                <button
                  onClick={() => handleAvatarClick('man_owner_2')}
                  className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-400 dark:border-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Assign hand-off owner
                  <div className="text-xs text-gray-300 mt-1">Click to assign</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Hand-off Time Text - Show if there's a handoff time and either two owners or one owner with handoff */}
      {handOffTime && (hasTwoOwners || (owner1 && !owner2)) && (
        <div className="mt-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Hand-off at {formatHandOffTime(handOffTime)}
          </span>
        </div>
      )}
      
      {/* User Selection Modal */}
      <UserSelectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOwner(null);
        }}
        onSelectUser={handleUserSelect}
        title={editingOwner === 'man_owner' ? 'Select Initial Owner' : 'Select Hand-off Owner'}
      />
    </div>
  );
} 