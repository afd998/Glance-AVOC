import React, { useState, useRef } from 'react';

import { useUserProfile } from '../../../../core/User/useUserProfile';
import { useRooms } from '../../../../core/Rooms/useRooms';
import { useUpdateShiftBlocks } from '../../hooks/useShiftBlocks';
import { Card, CardContent } from '../../../../components/ui/card';
import { Item, ItemMedia, ItemContent, ItemTitle, ItemGroup } from '../../../../components/ui/item';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../../../components/ui/context-menu';
import UserAvatar from '../../../../core/User/UserAvatar';
  

function formatTimeLabel(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Color map for 4th character of room name
const roomColorMap: Record<string, string> = {
  'L': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  '1': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  '2': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  '3': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
  '4': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  '5': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  '7': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
  '9': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
  '0': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
};

function getRoomBadgeColor(roomName: string) {
  if (!roomName || roomName.length < 4) return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
  const key = roomName[3];
  return roomColorMap[key] || 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
}

// Helper to display room name without 'GH '
function displayRoomName(name: string) {
  return name.startsWith('GH ') ? name.slice(3) : name;
}

// Normalize a room value that may be a string or an object with a name
function getRoomName(room: any): string {
  if (typeof room === 'string') return room;
  if (room && typeof room.name === 'string') return room.name;
  return '';
}

// Ensure all assignments store room names as strings
function normalizeAssignments(rawAssignments: any[]): Assignment[] {
  if (!Array.isArray(rawAssignments)) return [];
  return rawAssignments.map((a: any) => ({
    user: a.user,
    rooms: Array.isArray(a.rooms)
      ? a.rooms.map((r: any) => getRoomName(r)).filter((n: string) => n && typeof n === 'string')
      : []
  }));
}

interface Assignment {
  user: string;
  rooms: string[];
}

interface ShiftBlockProps {
  block: any;
  allBlocks: any[];
  onHeaderDrag?: (deltaX: number, deltaY: number) => void;
}

// Selection context for managing multi-selection across components
interface SelectionContextType {
  selectedRooms: Set<string>;
  lastSelectedRoom: string | null;
  selectRoom: (room: string, event: React.MouseEvent) => void;
  clearSelection: () => void;
  isSelected: (room: string) => boolean;
  moveSelectedRooms: (targetUserId: string | null) => void;
}

const SelectionContext = React.createContext<SelectionContextType | null>(null);

// Room badge component with selection support (no drag functionality)
function RoomBadge({
  room,
  isSelected,
  selectionContext,
  isInSelectionMode
}: {
  room: string;
  isSelected: boolean;
  selectionContext: SelectionContextType;
  isInSelectionMode: boolean;
}) {
  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    console.log('🔍 Room clicked:', room, 'Shift key:', event.shiftKey, 'Ctrl key:', event.ctrlKey);

    // Call selectRoom for selection handling
    selectionContext.selectRoom(room, event);
  };

  return (
    <Badge
      
      onClick={handleClick}
      className={`cursor-pointer rounded-lg transition-all duration-200 m-0.5  select-none ${
        getRoomBadgeColor(room)
      } ${
        isSelected
          ? 'ring-2 ring-blue-500 scale-105 bg-blue-100/80 dark:bg-blue-900/60 shadow-md'
          : 'hover:scale-105 hover:shadow-md'
      }`}
    >
      {displayRoomName(room)}
    </Badge>
  );
}

// User name component for dropdown
function UserNameDisplay({ userId }: { userId: string }) {
  const { data: profile } = useUserProfile(userId);
  return <span className="select-none">{profile?.name || userId}</span>;
}

// Bulk move button component - commented out since we now use context menu
/*
function BulkMoveButton({ 
  selectedCount, 
  onMoveToUser, 
  onMoveToRooms,
  availableUsers 
}: { 
  selectedCount: number;
  onMoveToUser: (userId: string) => void;
  onMoveToRooms: () => void;
  availableUsers: string[];
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <Select onValueChange={(value) => {
      if (value === 'unassigned') {
        onMoveToRooms();
      } else {
        onMoveToUser(value);
      }
    }}>
      <SelectTrigger className="w-auto text-xs select-none">
        <SelectValue placeholder={` ${selectedCount} selected`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          Move to Unassigned
        </SelectItem>
        {availableUsers.map(userId => (
          <SelectItem key={userId} value={userId}>
            Move to <UserNameDisplay userId={userId} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
*/

// Shift block assignment component (user section)
function ShiftBlockAssignment({
  userId,
  rooms,
  hasAllRooms,
  selectionContext,
  isInSelectionMode
}: {
  userId: string;
  rooms: string[];
  hasAllRooms?: boolean;
  selectionContext: SelectionContextType;
  isInSelectionMode: boolean;
}) {
  const { data: profile } = useUserProfile(userId || '');

  if (!userId) {
    console.warn('ShiftBlockAssignment: userId is undefined or null');
          return null;
        }

        return (
    <Item
      variant={hasAllRooms ? "muted" : "outline"}
      size="sm"
      className={`transition-all duration-200 bselect-none ${
        hasAllRooms
          ? 'border-green-300 bg-green-50/70 dark:bg-green-900/30'
          : 'border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/70'
      }`}
    >
      <ItemContent>
        <ItemTitle className="flex items-center gap-2">
          <UserAvatar userId={userId} size="sm" />
          <span className="font-medium text-gray-900 dark:text-white select-none">
            {profile?.name || userId}
          </span>
          {hasAllRooms && (
            <span className="px-1 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded select-none">
              All Rooms
            </span>
          )}
        </ItemTitle>
        <div className="flex flex-wrap gap-1 mt-2">
          {rooms.map((room) => {
            const name = getRoomName(room as any);
            if (!name) return null;
            return (
              <RoomBadge
                key={name}
                room={name}
                isSelected={selectionContext.isSelected(name)}
                selectionContext={selectionContext}
                isInSelectionMode={isInSelectionMode}
              />
            );
          })}
        </div>
      </ItemContent>
    </Item>
  );
}

// Rooms section component (unassigned rooms)
function RoomsSection({
  rooms,
  selectionContext,
  isInSelectionMode
}: {
  rooms: string[];
  selectionContext: SelectionContextType;
  isInSelectionMode: boolean;
}) {
  return (
    <Item
      variant="outline"
      size="sm"
      className="transition-all duration-200 min-h-[60px] backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/70 select-none"
    >
      <ItemContent>
        <ItemTitle>
          <span className="font-medium text-gray-900 dark:text-white select-none">
            Rooms:
          </span>
        </ItemTitle>
        <div className="flex flex-wrap gap-1 mt-2">
          {rooms.map((room) => {
            const name = getRoomName(room as any);
            if (!name) return null;
            return (
              <RoomBadge
                key={name}
                room={name}
                isSelected={selectionContext.isSelected(name)}
                selectionContext={selectionContext}
                isInSelectionMode={isInSelectionMode}
              />
            );
          })}
        </div>
      </ItemContent>
    </Item>
  );
}

const ShiftBlock: React.FC<ShiftBlockProps> = ({ block, allBlocks, onHeaderDrag }) => {
  const updateShiftBlocks = useUpdateShiftBlocks();
  const { rooms: allRooms } = useRooms();
  
  // Local state for assignments - sync with block.assignments when it changes
  const [assignments, setAssignments] = useState<Assignment[]>(normalizeAssignments(block.assignments || []));

  // Selection state
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [lastSelectedRoom, setLastSelectedRoom] = useState<string | null>(null);
  const [isInSelectionMode, setIsInSelectionMode] = useState(false);

  // Keep local state in sync with prop data
  React.useEffect(() => {
    setAssignments(normalizeAssignments(block.assignments || []));
  }, [block.assignments]);

  // Background drag-to-scroll state
  const [isBackgroundDragging, setIsBackgroundDragging] = useState(false);
  const [backgroundDragStart, setBackgroundDragStart] = useState({ x: 0, y: 0 });

  // Track mouse enter/leave to only detect modifier keys when hovering over this component
  const handleMouseEnter = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        setIsInSelectionMode(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
        setIsInSelectionMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Store cleanup function for later use
    (handleMouseEnter as any).cleanup = () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  };

  const handleMouseLeave = () => {
    setIsInSelectionMode(false);
    // Clean up event listeners when mouse leaves
    if ((handleMouseEnter as any).cleanup) {
      (handleMouseEnter as any).cleanup();
      (handleMouseEnter as any).cleanup = null;
    }
  };

  // Background drag-to-scroll handlers
  const handleBackgroundMouseDown = (event: React.MouseEvent) => {
    if (!onHeaderDrag) return;
    
    // Start drag if clicking on the background OR the time header
    const isBackgroundClick = event.target === event.currentTarget;
    const isTimeHeaderClick = (event.target as HTMLElement).tagName === 'H5';
    
    if (isBackgroundClick || isTimeHeaderClick) {
      setIsBackgroundDragging(true);
      setBackgroundDragStart({
        x: event.clientX,
        y: event.clientY
      });
      event.preventDefault();
    }
  };

  // Add global mouse move and up listeners for background drag-to-scroll
  React.useEffect(() => {
    if (isBackgroundDragging && onHeaderDrag) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        const deltaX = event.clientX - backgroundDragStart.x;
        const deltaY = event.clientY - backgroundDragStart.y;
        
        onHeaderDrag(deltaX, deltaY);
      };

      const handleGlobalMouseUp = () => {
        setIsBackgroundDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isBackgroundDragging, backgroundDragStart, onHeaderDrag]);



  // Get all assigned rooms
  const assignedRooms = new Set<string>();
  assignments.forEach((a: Assignment) => {
    a.rooms?.forEach(room => assignedRooms.add(getRoomName(room as any)));
  });

  // Get unassigned rooms (map room objects to their names)
  const allRoomNames = (allRooms || [])
    .map((room: any) => room?.name)
    .filter((name: any): name is string => typeof name === 'string' && name.length > 0);
  const unassignedRooms = allRoomNames.filter((roomName: string) => !assignedRooms.has(roomName));

  // Check if the single user has all rooms assigned
  const singleUserHasAllRooms = assignments.length === 1 && unassignedRooms.length === 0;

  // Get all available user IDs for bulk move
  const availableUserIds = assignments.map(a => a.user);

  // Selection context functions
  const selectRoom = (room: string, event: React.MouseEvent) => {
    console.log('🎯 selectRoom called:', room, 'Shift:', event.shiftKey, 'Ctrl:', event.ctrlKey, 'Last selected:', lastSelectedRoom, 'Current selection size:', selectedRooms.size);
    
    // Set selection mode if using modifier keys
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      setIsInSelectionMode(true);
    }
    
    if (event.shiftKey && lastSelectedRoom) {
      // Shift+Click: select range
      console.log('🔄 Shift+Click range selection');
      const allRoomsInBlock: string[] = [
        ...assignments.flatMap(a => a.rooms || []),
        ...unassignedRooms
      ];
      const lastIndex = allRoomsInBlock.indexOf(lastSelectedRoom);
      const currentIndex = allRoomsInBlock.indexOf(room);
      
      console.log('📍 Room indices:', { lastIndex, currentIndex, allRoomsInBlock });
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeRooms = allRoomsInBlock.slice(start, end + 1);
        
        console.log('📋 Range rooms:', rangeRooms);
        // Keep existing selections and add the range
        const newSelected = new Set(selectedRooms);
        rangeRooms.forEach(r => newSelected.add(r));
        console.log('📋 New selection:', Array.from(newSelected));
        setSelectedRooms(newSelected);
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+Click: toggle selection
      console.log('🔄 Ctrl+Click toggle selection');
      const newSelected = new Set(selectedRooms);
      if (newSelected.has(room)) {
        newSelected.delete(room);
        console.log('❌ Removed from selection:', room);
      } else {
        newSelected.add(room);
        console.log('✅ Added to selection:', room);
      }
      console.log('📋 New selection:', Array.from(newSelected));
      setSelectedRooms(newSelected);
    } else {
      // Regular click: select single room
      console.log('🔄 Regular click single selection');
      setSelectedRooms(new Set([room]));
      setIsInSelectionMode(false);
    }
    setLastSelectedRoom(room);
  };

  const clearSelection = () => {
    setSelectedRooms(new Set());
    setLastSelectedRoom(null);
    setIsInSelectionMode(false);
  };

  const isSelected = (room: string) => selectedRooms.has(room);

  const moveSelectedRooms = (targetUserId: string | null) => {
    if (selectedRooms.size === 0) return;

    let newAssignments = [...assignments];
    
    if (targetUserId === null) {
      // Move to unassigned (remove from all users)
      newAssignments = assignments.map((a: Assignment) => ({
        ...a,
        rooms: a.rooms.filter(r => !selectedRooms.has(r)),
      }));
    } else {
      // Move to specific user
      newAssignments = assignments.map((a: Assignment) => {
                 if (a.user === targetUserId) {
           return { 
             ...a, 
             rooms: Array.from(new Set([...(a.rooms || []), ...Array.from(selectedRooms)])) 
           };
         } else {
           // Remove from other users
           return { ...a, rooms: a.rooms.filter(r => !selectedRooms.has(r)) };
         }
      });
    }
    
    setAssignments(newAssignments);
    clearSelection();
    
    // Update the affected block in the allBlocks array
    const updatedBlocks = allBlocks.map(b =>
      b.id === block.id ? { ...b, assignments: newAssignments } : b
    );
    
    // Convert to ShiftBlockInsert format
    const newBlocks = updatedBlocks.map(b => ({
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      assignments: b.assignments,
    }));
    
    // Persist the changes
    updateShiftBlocks.mutate({
      date: block.date,
      newBlocks,
    }, {
      onSuccess: (data) => {
        console.log('✅ Shift blocks updated successfully:', data);
      },
      onError: (error) => {
        console.error('❌ Failed to update shift blocks:', error);
        setAssignments(block.assignments || []);
      }
    });
  };



  const selectionContext: SelectionContextType = {
    selectedRooms,
    lastSelectedRoom,
    selectRoom,
    clearSelection,
    isSelected,
    moveSelectedRooms,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card 
          className={`max-w-[300px] w-full transition-all duration-200 select-none ${
            isBackgroundDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleBackgroundMouseDown}
          onClick={(event) => {
            // Clear selection when clicking outside room badges
            if (event.target === event.currentTarget) {
              clearSelection();
            }
          }}
        >
      <CardContent className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h5 
          className={`font-medium text-gray-900 dark:text-white transition-all duration-200 select-none ${
            isBackgroundDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${onHeaderDrag ? 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50 px-2 py-1 rounded' : ''}`}
          onMouseDown={handleBackgroundMouseDown}
        >
          {formatTimeLabel(block.start_time)} - {formatTimeLabel(block.end_time)}
        </h5>
        {/* BulkMoveButton commented out - now using context menu for moving selected rooms */}
        {/*
        <div className="flex items-center gap-2">
          <BulkMoveButton
            selectedCount={selectedRooms.size}
            onMoveToUser={(userId) => moveSelectedRooms(userId)}
            onMoveToRooms={() => moveSelectedRooms(null)}
            availableUsers={availableUserIds}
          />
        </div>
        */}
      </div>
      
      <ItemGroup className="gap-3">
        {/* User assignments */}
        {assignments.map((assignment: Assignment, idx: number) => (
          <ShiftBlockAssignment
            key={`${assignment.user}-${idx}`}
            userId={assignment.user}
            rooms={assignment.rooms || []}
            hasAllRooms={singleUserHasAllRooms && assignments.length === 1}
            selectionContext={selectionContext}
            isInSelectionMode={isInSelectionMode}
          />
        ))}

        {/* Unassigned rooms */}
        <RoomsSection
          rooms={unassignedRooms}
          selectionContext={selectionContext}
          isInSelectionMode={isInSelectionMode}
        />
      </ItemGroup>
      </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {selectedRooms.size > 0 && (
          <>
            <ContextMenuItem onClick={() => moveSelectedRooms(null)}>
              Move {selectedRooms.size} selected to Unassigned
            </ContextMenuItem>
            {availableUserIds.map(userId => (
              <ContextMenuItem key={userId} onClick={() => moveSelectedRooms(userId)}>
                Move {selectedRooms.size} selected to <UserNameDisplay userId={userId} />
              </ContextMenuItem>
            ))}
          </>
        )}
        {selectedRooms.size === 0 && (
          <ContextMenuItem disabled>
            No rooms selected
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ShiftBlock; 