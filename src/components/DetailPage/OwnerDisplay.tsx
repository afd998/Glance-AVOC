import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEventOwnership, useAssignManualOwner, useClearManualOwner } from '../../hooks/useCalculateOwners';
import { useUserProfile } from '../../hooks/useUserProfile';
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

// Helper component to display user name in tooltip
const UserNameDisplay: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: userProfile } = useUserProfile(userId);
  return <span>{userProfile?.name || userId}</span>;
};

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
  // Get ownership data including timeline
  const { data: ownershipData } = useEventOwnership(event?.id);
  
  // Get timeline entries
  const timeline = ownershipData?.timeline || [];



  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Tooltip state
  const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);

  // Mutation hooks
  const assignManualOwnerMutation = useAssignManualOwner();
  const clearManualOwnerMutation = useClearManualOwner();

  const handleAvatarClick = () => {
    setIsModalOpen(true);
  };

  const handleUserSelect = (userId: string) => {
    assignManualOwnerMutation.mutate({ eventId: event.id, userId });
    setIsModalOpen(false);
  };

  // Check if there's a manual owner
  const hasManualOwner = !!event?.man_owner;



  // Don't render if no timeline entries
  if (timeline.length === 0) {
    return (
      <div className="mb-3 sm:mb-4">
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Assigned to:
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No owners found for this event
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 sm:mb-4">
      {/* "Assigned to:" text */}
      <div className="mb-2">
        <span className="text-sm font-medium text-black">
          Assigned to:
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {timeline.map((entry, index) => (
          <React.Fragment key={entry.ownerId}>
            {/* Owner Avatar */}
            <div className="relative">
              <Tooltip
                isVisible={hoveredAvatar === entry.ownerId}
                content={
                  <div>
                    <UserNameDisplay userId={entry.ownerId} />
                    <div className="text-xs text-gray-300 mt-1">
                      {hasManualOwner ? 'Click to change manual assignment' : 'Auto-assigned owner'}
                    </div>
                  </div>
                }
              >
                {hasManualOwner ? (
                  <button
                    onClick={handleAvatarClick}
                    onMouseEnter={() => setHoveredAvatar(entry.ownerId)}
                    onMouseLeave={() => setHoveredAvatar(null)}
                    className="hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200"
                  >
                    <Avatar userId={entry.ownerId} size="md" />
                  </button>
                ) : (
                  <div
                    onMouseEnter={() => setHoveredAvatar(entry.ownerId)}
                    onMouseLeave={() => setHoveredAvatar(null)}
                    className="cursor-default"
                  >
                    <Avatar userId={entry.ownerId} size="md" />
                  </div>
                )}
              </Tooltip>
              {/* Only show clear button if this is a manual assignment */}
              {hasManualOwner && (
                <button
                  onClick={() => clearManualOwnerMutation.mutate({ eventId: event.id })}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  title="Clear manual assignment (return to auto-assignment)"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Arrow and transition time (if not the last owner) */}
            {entry.transitionTime && index < timeline.length - 1 && (
              <div className="flex flex-col items-center gap-1">
                {/* Arrow */}
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                
                {/* Transition time */}
                <span className="text-xs text-black font-medium">
                  {formatHandOffTime(entry.transitionTime)}
                </span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Manual Assignment Button - moved below timeline */}
      {!hasManualOwner && (
        <div className="mt-2">
          <button
            onClick={handleAvatarClick}
            className="flex items-center gap-2 text-sm text-black hover:text-gray-800 transition-colors"
            title="Assign manual owner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Assign Owner
          </button>
        </div>
      )}
      
      {/* User Selection Modal */}
      <UserSelectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onSelectUser={handleUserSelect}
        title={hasManualOwner ? 'Select Initial Owner' : 'Select Manual Owner'}
      />
    </div>
  );
} 