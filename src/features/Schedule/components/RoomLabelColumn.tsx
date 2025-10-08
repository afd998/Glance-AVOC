import React from "react";
import { Badge } from "../../../components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../../components/ui/context-menu";
import UserAvatar from "../../../core/User/UserAvatar";
import { useUserProfile } from "../../../core/User/useUserProfile";
import { useEventAssignments } from "../../../contexts/EventAssignmentsContext";
import {
  useShiftBlocks,
  useUpdateShiftBlocks,
} from "../EventAssignments/hooks/useShiftBlocks";

interface RoomLabelColumnProps {
  headerHeightPx: number;
  pageZoom: number;
  leftLabelBaseWidth: number;
  scrollTop: number;
  rowHeightPx: number;
  roomRows: any[];
  filteredLCEvents?: any[] | null;
  dateString: string;
}

function UserNameDisplay({ userId }: { userId: string }) {
  const { data: profile } = useUserProfile(userId);
  return <span className="select-none">{profile?.name || userId}</span>;
}

const RoomLabelColumn: React.FC<RoomLabelColumnProps> = ({
  headerHeightPx,
  pageZoom,
  leftLabelBaseWidth,
  scrollTop,
  rowHeightPx,
  roomRows,
  filteredLCEvents,
  dateString,
}) => {
  const [selectedRoomsSet, setSelectedRoomsSet] = React.useState<Set<string>>(
    new Set()
  );
  const [lastSelectedRoom, setLastSelectedRoom] = React.useState<string | null>(
    null
  );

  const {
    showEventAssignments,
    selectedShiftBlock,
    setSelectedShiftBlock,
    setSelectedShiftBlockId,
    setSelectedShiftBlockIndex,
  } = useEventAssignments();
  const { data: shiftBlocks = [] } = useShiftBlocks(dateString);
  const updateShiftBlocks = useUpdateShiftBlocks();

  const labelRoomOrder = React.useMemo(() => {
    const baseRooms = Array.isArray(roomRows)
      ? roomRows.map((r: any) => r.name)
      : [];
    const lcRooms = Array.isArray(filteredLCEvents)
      ? filteredLCEvents.map((r: any) => r.room_name)
      : [];
    return [...baseRooms, ...lcRooms];
  }, [roomRows, filteredLCEvents]);

  const isRoomSelected = React.useCallback(
    (roomName: string) => selectedRoomsSet.has(roomName),
    [selectedRoomsSet]
  );

  const getBadgeColorClass = React.useCallback((roomName: string) => {
    const firstChar = roomName.replace(/^GH\s+/, "").charAt(0).toUpperCase();

    switch (firstChar) {
      case "L":
        return "!bg-primary-100 text-primary-foreground";
      case "1":
        return "!bg-primary-200 text-primary-foreground";
      case "2":
        return "!bg-primary-300 text-primary-foreground";
      case "3":
        return "!bg-primary-400 text-primary-foreground";
      case "4":
        return "!bg-primary-500 text-primary-foreground";
      case "5":
        return "!bg-primary-600 text-primary-foreground";
      default:
        return "!bg-primary-100 text-primary-foreground";
    }
  }, []);

  const selectRoomLabel = React.useCallback(
    (roomName: string, event: React.MouseEvent<HTMLDivElement>) => {
      if (!showEventAssignments) return;

      setSelectedRoomsSet((prev) => {
        if (event.shiftKey && lastSelectedRoom) {
          const lastIndex = labelRoomOrder.indexOf(lastSelectedRoom);
          const currentIndex = labelRoomOrder.indexOf(roomName);
          if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            const rangeRooms = labelRoomOrder.slice(start, end + 1);
            const next = new Set(prev);
            rangeRooms.forEach((r) => next.add(r));
            return next;
          }
        } else if (event.ctrlKey || event.metaKey) {
          const next = new Set(prev);
          if (next.has(roomName)) {
            next.delete(roomName);
          } else {
            next.add(roomName);
          }
          return next;
        }

        return new Set([roomName]);
      });
      setLastSelectedRoom(roomName);
    },
    [showEventAssignments, lastSelectedRoom, labelRoomOrder]
  );

  const clearSelection = React.useCallback(() => {
    setSelectedRoomsSet(new Set());
    setLastSelectedRoom(null);
  }, []);

  const handleMoveSelectedRooms = React.useCallback(
    (targetUserId: string | null) => {
      if (
        !showEventAssignments ||
        !selectedShiftBlock ||
        selectedRoomsSet.size === 0
      ) {
        return;
      }

      const roomNames = Array.from(selectedRoomsSet);
      const assignments: any[] = Array.isArray(
        (selectedShiftBlock as any).assignments
      )
        ? (selectedShiftBlock as any).assignments
        : [];

      let newAssignments = assignments.map((a: any) => ({
        user: a.user,
        rooms: Array.isArray(a.rooms) ? [...a.rooms] : [],
      }));

      newAssignments = newAssignments.map((a: any) => ({
        ...a,
        rooms: a.rooms.filter((r: string) => !selectedRoomsSet.has(r)),
      }));

      if (targetUserId !== null) {
        const target = newAssignments.find((a: any) => a.user === targetUserId);
        if (target) {
          const merged = new Set<string>([...target.rooms, ...roomNames]);
          target.rooms = Array.from(merged);
        }
      }

      const updatedBlocks = shiftBlocks.map((b: any) =>
        selectedShiftBlock && b.id === selectedShiftBlock.id
          ? { ...b, assignments: newAssignments }
          : b
      );

      const blocksToInsert = updatedBlocks.map((b: any) => ({
        date: b.date,
        start_time: b.start_time,
        end_time: b.end_time,
        assignments: b.assignments,
      }));

      updateShiftBlocks.mutate(
        { date: dateString, newBlocks: blocksToInsert },
        {
          onSuccess: (insertedBlocks) => {
            clearSelection();
            if (Array.isArray(insertedBlocks) && selectedShiftBlock) {
              const prevStart = selectedShiftBlock.start_time;
              const prevEnd = selectedShiftBlock.end_time;
              if (prevStart && prevEnd) {
                const matchIndex = blocksToInsert.findIndex(
                  (block) =>
                    block.start_time === prevStart &&
                    block.end_time === prevEnd
                );
                const match = insertedBlocks.find(
                  (block) =>
                    block.start_time === prevStart &&
                    block.end_time === prevEnd
                );
                if (match) {
                  setSelectedShiftBlockId(match.id.toString());
                  setSelectedShiftBlock(match);
                  setSelectedShiftBlockIndex(
                    matchIndex >= 0 ? matchIndex : null
                  );
                }
              }
            }
          },
        }
      );
    },
    [
      showEventAssignments,
      selectedShiftBlock,
      selectedRoomsSet,
      shiftBlocks,
      updateShiftBlocks,
      dateString,
      clearSelection,
      setSelectedShiftBlockId,
      setSelectedShiftBlock,
      setSelectedShiftBlockIndex,
    ]
  );

  React.useEffect(() => {
    if (!showEventAssignments) {
      clearSelection();
    }
  }, [showEventAssignments, clearSelection]);

  const shiftAssignments: any[] = Array.isArray(
    (selectedShiftBlock as any)?.assignments
  )
    ? (selectedShiftBlock as any).assignments
    : [];

  return (
    <div
      className="z-50 overflow-hidden"
      style={{
        position: "absolute",
        top: `${headerHeightPx * pageZoom}px`,
        left: 0,
        width: `${leftLabelBaseWidth * pageZoom}px`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `translateY(-${scrollTop}px) scale(${pageZoom})`,
          transformOrigin: "top left",
          width: `60px`,
        }}
      >
        <div style={{ position: "relative" }}>
          {roomRows.map((room: any) => {
            const assignedUserId: string | null = (() => {
              if (!showEventAssignments || !selectedShiftBlock) return null;
              const match = shiftAssignments.find(
                (a: any) => Array.isArray(a?.rooms) && a.rooms.includes(room.name)
              );
              return match?.user ?? null;
            })();

            return (
              <ContextMenu key={`label-${room.name}`}>
                <ContextMenuTrigger asChild>
                  <div
                    data-room-label
                    style={{ height: `${rowHeightPx}px` }}
                    className="flex text-foreground flex-col bg-primary/10 items-center justify-center pointer-events-auto cursor-pointer"
                    onClick={(event) => selectRoomLabel(room.name, event)}
                  >
                    <div className="flex flex-col items-center">
                      <Badge
                        className={` ${
                          isRoomSelected(room.name)
                            ? "ring-10 ring-blue-500"
                            : ""
                        }`}
                        variant={"default"}
                        style={{
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none",
                        }}
                      >
                        {room.name.replace(/^GH\s+/, "")}
                      </Badge>
                      {assignedUserId && (
                        <div className="mt-1">
                          <UserAvatar
                            userId={assignedUserId}
                            size="sm"
                            variant="solid"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>
                {showEventAssignments && selectedShiftBlock && (
                  <ContextMenuContent>
                    {selectedRoomsSet.size > 0 && (
                      <>
                        <ContextMenuItem
                          onClick={() => {
                            void handleMoveSelectedRooms(null);
                          }}
                        >
                          Move {selectedRoomsSet.size} selected to Unassigned
                        </ContextMenuItem>
                        {shiftAssignments.map((a: any) => (
                          <ContextMenuItem
                            key={a.user}
                            onClick={() => {
                              void handleMoveSelectedRooms(a.user);
                            }}
                          >
                            Move {selectedRoomsSet.size} selected to{" "}
                            <UserAvatar userId={a.user} size="sm" variant="solid" />
                          </ContextMenuItem>
                        ))}
                      </>
                    )}
                  </ContextMenuContent>
                )}
              </ContextMenu>
            );
          })}

          {(filteredLCEvents ?? []).map((roomData: any) => (
            <ContextMenu key={`label-${roomData.room_name}`}>
              <ContextMenuTrigger asChild>
                <div
                  data-room-label
                  style={{ height: `${rowHeightPx}px` }}
                  className="flex items-center justify-center pointer-events-auto cursor-pointer"
                  onClick={(event) => selectRoomLabel(roomData.room_name, event)}
                >
                  <div>
                    <Badge
                      className={`${
                        isRoomSelected(roomData.room_name)
                          ? "ring-5 bg-green-500 ring-blue-500"
                          : ""
                      }`}
                      variant={"outline"}
                      style={{
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                      }}
                    >
                      {roomData.room_name}
                    </Badge>
                  </div>
                </div>
              </ContextMenuTrigger>
              {showEventAssignments && selectedShiftBlock && (
                <ContextMenuContent>
                  {selectedRoomsSet.size > 0 && (
                    <>
                      <ContextMenuItem
                        onClick={() => {
                          void handleMoveSelectedRooms(null);
                        }}
                      >
                        Move {selectedRoomsSet.size} selected to Unassigned
                      </ContextMenuItem>
                      {shiftAssignments.map((a: any) => (
                        <ContextMenuItem
                          key={a.user}
                          onClick={() => {
                            void handleMoveSelectedRooms(a.user);
                          }}
                        >
                          Move {selectedRoomsSet.size} selected to{" "}
                          <UserNameDisplay userId={a.user} />
                        </ContextMenuItem>
                      ))}
                    </>
                  )}
                </ContextMenuContent>
              )}
            </ContextMenu>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomLabelColumn;
