import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOwnerDisplay, useHandOffTime } from '../../hooks/useOwnerDisplay';
import Avatar from '../Avatar';
import UserSelectionModal from '../UserSelectionModal';
import type { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface OwnerDisplayProps {
  event: Event;
  isHandOffTimeLoading: boolean;
}

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

// Custom Tooltip Component that uses portal
interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  isVisible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, isVisible }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.getBoundingClientRect();
      
      // Calculate position to center tooltip above the trigger
      const left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      const top = triggerRect.top - tooltipRect.height - 8; // 8px gap
      
      // Ensure tooltip doesn't go off-screen
      const adjustedLeft = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
      const adjustedTop = Math.max(8, top);
      
      setPosition({ top: adjustedTop, left: adjustedLeft });
    }
  }, [isVisible, tooltipRef]);

  return (
    <div ref={triggerRef} className="relative">
      {children}
      {isVisible && createPortal(
        <div
          ref={setTooltipRef}
          className="fixed px-2 py-1 bg-gray-900 text-white text-xs rounded pointer-events-none whitespace-nowrap z-[9999] max-w-xs"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
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
  
  // Tooltip state
  const [hoveredAvatar, setHoveredAvatar] = useState<'owner1' | 'owner2' | 'empty1' | 'empty2' | null>(null);

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
          <div className="relative">
            <Tooltip
              isVisible={hoveredAvatar === 'owner1'}
              content={
                <div>
                  {owner1Profile?.name || owner1}
                  <div className="text-xs text-gray-300 mt-1">
                    {isOwner1FromManOwner ? 'Click to change' : 'Click to override auto-assignment'}
                  </div>
                </div>
              }
            >
              <button
                onClick={() => handleAvatarClick('man_owner')}
                onMouseEnter={() => setHoveredAvatar('owner1')}
                onMouseLeave={() => setHoveredAvatar(null)}
                className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
              >
                <Avatar userId={owner1} size="md" />
                {/* Show indicator if displaying from auto-assigned owner */}
                {!isOwner1FromManOwner && (
                  <div className="absolute -bottom-2 -right-2 px-1 py-0.5 bg-gray-400 text-white text-[8px] font-medium rounded border border-white dark:border-gray-800">
                    AUTO
                  </div>
                )}
              </button>
            </Tooltip>
            {/* Only show clear button if this is a manual assignment */}
            {isOwner1FromManOwner && (
              <button
                onClick={() => handleClearOwner('man_owner')}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                title="Clear manual assignment (return to auto-assignment)"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        {/* Show empty avatar for first owner if no primary owner */}
        {!owner1 && (
          <div className="relative">
            <Tooltip
              isVisible={hoveredAvatar === 'empty1'}
              content={
                <div>
                  Assign initial owner
                  <div className="text-xs text-gray-300 mt-1">Click to assign</div>
                </div>
              }
            >
              <button
                onClick={() => handleAvatarClick('man_owner')}
                onMouseEnter={() => setHoveredAvatar('empty1')}
                onMouseLeave={() => setHoveredAvatar(null)}
                className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-400 dark:border-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </button>
            </Tooltip>
          </div>
        )}
        
        {/* Arrow and Second Owner - Show only if there are two different owners */}
        {hasTwoOwners && (
          <>
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="relative">
              <Tooltip
                isVisible={hoveredAvatar === 'owner2'}
                content={
                  <div>
                    {owner2Profile?.name || owner2}
                    <div className="text-xs text-gray-300 mt-1">
                      {isOwner2FromManOwner ? 'Click to change' : 'Click to override auto-assignment'}
                    </div>
                  </div>
                }
              >
                <button
                  onClick={() => handleAvatarClick('man_owner_2')}
                  onMouseEnter={() => setHoveredAvatar('owner2')}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
                >
                  <Avatar userId={owner2!} size="md" />
                  {/* Show indicator if displaying from auto-assigned owner */}
                  {!isOwner2FromManOwner && (
                    <div className="absolute -bottom-2 -right-2 px-1 py-0.5 bg-gray-400 text-white text-[8px] font-medium rounded border border-white dark:border-gray-800">
                      AUTO
                    </div>
                  )}
                </button>
              </Tooltip>
              {/* Only show clear button if this is a manual assignment */}
              {isOwner2FromManOwner && (
                <button
                  onClick={() => handleClearOwner('man_owner_2')}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  title="Clear manual assignment (return to auto-assignment)"
                >
                  ×
                </button>
              )}
            </div>
          </>
        )}
        
        {/* Show empty avatar for handoff owner if there's a handoff time but no second owner */}
        {handOffTime && !owner2 && (
          <>
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="relative">
              <Tooltip
                isVisible={hoveredAvatar === 'empty2'}
                content={
                  <div>
                    Assign hand-off owner
                    <div className="text-xs text-gray-300 mt-1">Click to assign</div>
                  </div>
                }
              >
                <button
                  onClick={() => handleAvatarClick('man_owner_2')}
                  onMouseEnter={() => setHoveredAvatar('empty2')}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-400 dark:border-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </button>
              </Tooltip>
            </div>
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