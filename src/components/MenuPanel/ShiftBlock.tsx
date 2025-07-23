import React, { useState, useRef } from 'react';
import Avatar from '../Avatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useRooms } from '../../hooks/useRooms';
import { useUpdateShiftBlocks } from '../../hooks/useShiftBlocks';
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
  DragOverlay,
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

const ShiftBlockAssignment: React.FC<{ userId: string; children?: React.ReactNode; onDropRooms?: (rooms: string[]) => void }> = ({ userId, children }) => {
  const { data: userProfile } = useUserProfile(userId);
  const { setNodeRef, isOver } = useDroppable({ id: userId });
  return (
    <div ref={setNodeRef} className={`flex items-center gap-1 p-1 rounded ${isOver ? 'ring-2 ring-purple-500' : ''}`}
      style={{ minWidth: 80, minHeight: 32 }}>
      <Avatar userId={userId} size="sm" />
      <span className="text-xs text-gray-700 dark:text-gray-200">{userProfile?.name || 'Unknown'}</span>
      {children}
    </div>
  );
};

interface ShiftBlockProps {
  block: any;
  allBlocks: any[];
}

const ShiftBlock: React.FC<ShiftBlockProps> = ({ block, allBlocks }) => {
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const [assignments, setAssignments] = useState<Assignment[]>(block.assignments || []);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [draggingRoom, setDraggingRoom] = useState<string | null>(null);
  const [selectRect, setSelectRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const badgeRefs = useRef<{ [room: string]: HTMLSpanElement | null }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  // Track where the drag started ("rooms" or userId)
  const [dragSource, setDragSource] = useState<string | null>(null);
  const selectStartRef = useRef<{ x: number; y: number } | null>(null);
  const updateShiftBlocks = useUpdateShiftBlocks();

  // Compute unassigned rooms
  const assignedRoomSet = new Set(assignments.flatMap(a => a.rooms || []));
  const unassignedRooms = rooms?.filter(room => room.name && !assignedRoomSet.has(room.name)) || [];

  // Multi-select with shift+click or drag
  const handleBadgeClick = (roomName: string, e: React.MouseEvent, source: string) => {
    if (e.shiftKey) {
      setSelectedRooms((prev) => prev.includes(roomName)
        ? prev.filter(r => r !== roomName)
        : [...prev, roomName]);
    } else {
      setSelectedRooms([roomName]);
      setDragSource(source);
    }
  };

  // Mouse events for selection rectangle (only for unassigned rooms)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    selectStartRef.current = { x: startX, y: startY };
    setSelectRect({ x: startX, y: startY, w: 0, h: 0 });
    setIsSelecting(true);
    setDragSource('rooms');
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const handleWindowMouseMove = (e: MouseEvent) => {
    if (!isSelecting || !selectStartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;
    const anchor = selectStartRef.current;
    const newRect = {
      x: Math.min(anchor.x, currX),
      y: Math.min(anchor.y, currY),
      w: Math.abs(currX - anchor.x),
      h: Math.abs(currY - anchor.y),
    };
    setSelectRect(newRect);
    // Dynamically update selectedRooms as the rectangle moves
    const selected: string[] = [];
    Object.entries(badgeRefs.current).forEach(([room, el]) => {
      if (!el) return;
      const badgeRect = el.getBoundingClientRect();
      const parentRect = containerRef.current!.getBoundingClientRect();
      const bx = badgeRect.left - parentRect.left;
      const by = badgeRect.top - parentRect.top;
      const bw = badgeRect.width;
      const bh = badgeRect.height;
      if (
        bx < newRect.x + newRect.w &&
        bx + bw > newRect.x &&
        by < newRect.y + newRect.h &&
        by + bh > newRect.y
      ) {
        selected.push(room);
      }
    });
    setSelectedRooms(selected);
  };

  const handleWindowMouseUp = () => {
    setSelectRect(null);
    setIsSelecting(false);
    selectStartRef.current = null;
    window.removeEventListener('mousemove', handleWindowMouseMove);
    window.removeEventListener('mouseup', handleWindowMouseUp);
  };

  // DnD logic
  const handleDragStart = (event: any) => {
    setDraggingRoom(event.active.id);
    // Find which source the badge is from
    let found = false;
    if (unassignedRooms.some(r => r.name === event.active.id)) {
      setDragSource('rooms');
      found = true;
    } else {
      for (const a of assignments) {
        if (a.rooms && a.rooms.includes(event.active.id)) {
          setDragSource(a.user);
          found = true;
          break;
        }
      }
    }
    if (!selectedRooms.includes(event.active.id)) {
      setSelectedRooms([event.active.id]);
    }
  };
  const handleDragEnd = (event: any) => {
    const { over } = event;
    let newAssignments = assignments;
    if (over && over.id) {
      if (over.id === 'rooms') {
        // Unassign: remove from all users
        newAssignments = assignments.map((a: Assignment) => ({
          ...a,
          rooms: a.rooms.filter(r => !selectedRooms.includes(r)),
        }));
        setAssignments(newAssignments);
        // Update the affected block in the allBlocks array
        const updatedBlocks = allBlocks.map(b =>
          b.id === block.id ? { ...b, assignments: newAssignments } : b
        );
        // Persist the full set of shift blocks for the day/week
        updateShiftBlocks.mutate({
          day_of_week: block.day_of_week,
          week_start: block.week_start,
          newBlocks: updatedBlocks,
        });
      } else {
        // Move to another user
        newAssignments = assignments.map((a: Assignment) => {
          if (a.user === over.id) {
            return { ...a, rooms: Array.from(new Set([...(a.rooms || []), ...selectedRooms])) };
          } else {
            // Remove from other users
            return { ...a, rooms: a.rooms.filter(r => !selectedRooms.includes(r)) };
          }
        });
        setAssignments(newAssignments);
        // Update the affected block in the allBlocks array
        const updatedBlocks = allBlocks.map(b =>
          b.id === block.id ? { ...b, assignments: newAssignments } : b
        );
        // Persist the full set of shift blocks for the day/week
        updateShiftBlocks.mutate({
          day_of_week: block.day_of_week,
          week_start: block.week_start,
          newBlocks: updatedBlocks,
        });
      }
    }
    setDraggingRoom(null);
    setSelectedRooms([]);
    setDragSource(null);
  };

  // Make Rooms: section droppable
  const { setNodeRef: setRoomsDropRef, isOver: isOverRooms } = useDroppable({ id: 'rooms' });

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="p-4 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2 md:mb-0">
          {formatTimeLabel(block.start_time)} – {formatTimeLabel(block.end_time)}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {Array.isArray(assignments) && assignments.length > 0 ? (
            assignments.map((assignment, idx) => (
              <div key={assignment.user || idx} className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-900 flex items-center">
                <ShiftBlockAssignment userId={assignment.user}>
                  <div className="flex flex-wrap gap-1 ml-2">
                    {assignment.rooms && assignment.rooms.length > 0 && [...assignment.rooms].sort().map((room: string) => (
                      <DraggableRoomBadge
                        key={room}
                        id={room}
                        name={room}
                        selected={selectedRooms.includes(room)}
                        onClick={(name, e) => handleBadgeClick(name, e, assignment.user)}
                        dragging={draggingRoom === room}
                        badgeRef={el => (badgeRefs.current[room] = el)}
                      />
                    ))}
                  </div>
                </ShiftBlockAssignment>
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-400">No assignments</span>
          )}
        </div>
        {/* Room badges (draggable) */}
        <div
          className={`flex flex-wrap gap-2 mt-2 relative border-2 border-gray-300 dark:border-gray-600 rounded p-4 bg-gray-50 dark:bg-gray-900 ${isOverRooms ? 'ring-2 ring-purple-400' : ''}`}
          ref={el => {
            setRoomsDropRef(el);
            containerRef.current = el;
          }}
          onMouseDown={handleMouseDown}
          style={{ userSelect: isSelecting ? 'none' : undefined }}
        >
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mr-2">Rooms:</span>
          {roomsLoading && <span className="text-xs text-gray-400">Loading rooms…</span>}
          {unassignedRooms.length > 0 && unassignedRooms.map(room => (
            <DraggableRoomBadge
              key={room.id}
              id={room.name || ''}
              name={room.name || ''}
              selected={selectedRooms.includes(room.name || '')}
              onClick={(name, e) => handleBadgeClick(name, e, 'rooms')}
              dragging={draggingRoom === room.name}
              badgeRef={el => (badgeRefs.current[room.name || ''] = el)}
            />
          ))}
          {unassignedRooms.length === 0 && <span className="text-xs text-gray-400">No rooms</span>}
          {/* Selection rectangle overlay */}
          {selectRect && (
            <div
              className="absolute border-2 border-purple-400 bg-purple-200 bg-opacity-20 pointer-events-none"
              style={{
                left: selectRect.x,
                top: selectRect.y,
                width: selectRect.w,
                height: selectRect.h,
                zIndex: 10,
              }}
            />
          )}
        </div>
        <DragOverlay>
          {draggingRoom && (
            <div className="flex gap-1">
              {selectedRooms.map(room => (
                <span key={room} className={`px-2 py-1 rounded text-xs font-medium border border-gray-300 ${getRoomBadgeColor(room)}`}>{displayRoomName(room)}</span>
              ))}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

const DraggableRoomBadge: React.FC<{
  id: string;
  name: string;
  selected: boolean;
  onClick: (name: string, e: React.MouseEvent) => void;
  dragging: boolean;
  badgeRef?: (el: HTMLSpanElement | null) => void;
}> = ({ id, name, selected, onClick, dragging, badgeRef }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <span
      ref={el => {
        setNodeRef(el);
        if (badgeRef) badgeRef(el);
      }}
      {...attributes}
      {...listeners}
      onClick={e => onClick(name, e)}
      className={`px-2 py-1 rounded text-xs font-medium border border-gray-300 cursor-pointer select-none ${getRoomBadgeColor(name)} ${selected ? 'ring-2 ring-purple-500' : ''} ${isDragging || dragging ? 'opacity-60' : ''}`}
      style={{ userSelect: 'none' }}
    >
      {displayRoomName(name)}
    </span>
  );
};

export default ShiftBlock; 