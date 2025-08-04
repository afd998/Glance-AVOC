import React, { useState } from 'react';
import Avatar from '../Avatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useRooms } from '../../hooks/useRooms';
import { useUpdateShiftBlocks } from '../../hooks/useShiftBlocks';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';

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

interface Assignment {
  user: string;
  rooms: string[];
}

interface ShiftBlockProps {
  block: any;
  allBlocks: any[];
}

// Draggable room badge component
function DraggableRoomBadge({ room, dragging }: { room: string; dragging: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: room,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  if (dragging && isDragging) {
    return null; // Hide the original when dragging
  }

  return (
    <span
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`inline-block px-2 py-1 text-xs rounded cursor-grab active:cursor-grabbing ${getRoomBadgeColor(room)} ${isDragging ? 'opacity-50' : ''}`}
    >
      {displayRoomName(room)}
    </span>
  );
}

// Shift block assignment component (user section)
function ShiftBlockAssignment({ userId, rooms, isOver, hasAllRooms }: { userId: string; rooms: string[]; isOver: boolean; hasAllRooms?: boolean }) {
  // Always call the hooks, even if userId is undefined
  const { data: profile } = useUserProfile(userId || '');
  const { setNodeRef } = useDroppable({
    id: userId || '',
  });

  // Add defensive check for undefined userId
  if (!userId) {
    console.warn('ShiftBlockAssignment: userId is undefined or null');
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col p-3 rounded border-2 transition-colors ${
        isOver 
          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
          : hasAllRooms
          ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar userId={userId} size="sm" />
        <span className="font-medium text-gray-900 dark:text-white">
          {profile?.name || userId}
        </span>
        {hasAllRooms && (
          <span className="px-1 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded">
            All Rooms
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {rooms.map((room) => (
          <DraggableRoomBadge key={room} room={room} dragging={false} />
        ))}
      </div>
    </div>
  );
}

// Rooms section component (unassigned rooms)
function RoomsSection({ rooms, isOver, roomsDropId }: { rooms: string[]; isOver: boolean; roomsDropId: string }) {
  const { setNodeRef } = useDroppable({
    id: roomsDropId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded border-2 transition-colors min-h-[60px] ${
        isOver 
          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-gray-900 dark:text-white">
          Rooms:
        </span>
        {isOver && (
          <span className="text-xs text-purple-600 dark:text-purple-400">
            Drop here to unassign
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {rooms.map((room) => (
          <DraggableRoomBadge key={room} room={room} dragging={false} />
        ))}
      </div>
    </div>
  );
}

const ShiftBlock: React.FC<ShiftBlockProps> = ({ block, allBlocks }) => {
  const updateShiftBlocks = useUpdateShiftBlocks();
  const { rooms: allRooms } = useRooms();
  
  // Local state for assignments - sync with block.assignments when it changes
  const [assignments, setAssignments] = useState<Assignment[]>(block.assignments || []);
  const [draggingRoom, setDraggingRoom] = useState<string | null>(null);

  // Keep local state in sync with prop data
  React.useEffect(() => {
    setAssignments(block.assignments || []);
  }, [block.assignments]);

  // Create unique drop ID for rooms section
  const roomsDropId = `rooms-${block.id}`;

  // Get all assigned rooms
  const assignedRooms = new Set<string>();
  assignments.forEach((a: Assignment) => {
    a.rooms?.forEach(room => assignedRooms.add(room));
  });

  // Get unassigned rooms
  const allRoomNames = allRooms?.filter((n): n is string => !!n) || [];
  const unassignedRooms = allRoomNames.filter((room: string) => !assignedRooms.has(room));

  // Check if the single user has all rooms assigned
  const singleUserHasAllRooms = assignments.length === 1 && unassignedRooms.length === 0;

  const handleDragStart = (event: any) => {
    setDraggingRoom(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { over } = event;
    const draggedRoom = event.active.id;
    
    console.log('🔄 Drag end event:', { over, draggedRoom, currentAssignments: assignments });
    
    if (over && over.id) {
      let newAssignments = [...assignments];
      
      if (over.id === roomsDropId) {
        // Unassign: remove from all users
        newAssignments = assignments.map((a: Assignment) => ({
          ...a,
          rooms: a.rooms.filter(r => r !== draggedRoom),
        }));
        console.log('🗑️ Unassigning room:', draggedRoom);
      } else {
        // Move to another user
        newAssignments = assignments.map((a: Assignment) => {
          if (a.user === over.id) {
            return { ...a, rooms: Array.from(new Set([...(a.rooms || []), draggedRoom])) };
          } else {
            // Remove from other users
            return { ...a, rooms: a.rooms.filter(r => r !== draggedRoom) };
          }
        });
        console.log('👤 Assigning room to user:', { room: draggedRoom, user: over.id });
      }
      
      console.log('📝 New assignments:', newAssignments);
      setAssignments(newAssignments);
      
      // Update the affected block in the allBlocks array
      const updatedBlocks = allBlocks.map(b =>
        b.id === block.id ? { ...b, assignments: newAssignments } : b
      );
      
      // Convert to ShiftBlockInsert format (remove database-generated fields)
      const newBlocks = updatedBlocks.map(b => ({
        date: b.date,
        start_time: b.start_time,
        end_time: b.end_time,
        assignments: b.assignments,
      }));
      
      // Persist the full set of shift blocks for the date
      console.log('🔄 Updating shift blocks with:', {
        date: block.date,
        newBlocks,
        draggedRoom,
        newAssignments
      });
      
      console.log('🚀 Calling updateShiftBlocks mutation...');
      updateShiftBlocks.mutate({
        date: block.date,
        newBlocks,
      }, {
        onSuccess: (data) => {
          console.log('✅ Shift blocks updated successfully:', data);
        },
        onError: (error) => {
          console.error('❌ Failed to update shift blocks:', error);
          // Revert local state on error
          setAssignments(block.assignments || []);
        }
      });
    }
    setDraggingRoom(null);
  };



  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between items-center mb-4">
           <h5 className="font-medium text-gray-900 dark:text-white">
             {formatTimeLabel(block.start_time)} - {formatTimeLabel(block.end_time)}
           </h5>
         </div>
        
        <div className="space-y-3">
          {/* User assignments */}
          {assignments.map((assignment: Assignment, idx: number) => (
            <ShiftBlockAssignment
              key={`${assignment.user}-${idx}`}
              userId={assignment.user}
              rooms={assignment.rooms || []}
              isOver={false}
              hasAllRooms={singleUserHasAllRooms && assignments.length === 1}
            />
          ))}
          
          {/* Unassigned rooms */}
          <RoomsSection
            rooms={unassignedRooms}
            isOver={false}
            roomsDropId={roomsDropId}
          />
        </div>
      </div>
      
      {/* Drag overlay */}
      <DragOverlay>
        {draggingRoom ? (
          <div className={`px-2 py-1 text-xs rounded cursor-grabbing ${getRoomBadgeColor(draggingRoom)}`}>
            {displayRoomName(draggingRoom)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ShiftBlock; 