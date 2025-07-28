import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { useShifts, useUpsertShift, useCopyShiftsFromPreviousWeek, Shift } from '../../hooks/useShifts';
import { supabase } from '../../lib/supabase';
import { calculateNewShiftBlocks, useUpdateShiftBlocks, useCopyShiftBlocks } from '../../hooks/useShiftBlocks';
import ShiftBlocks from './ShiftBlocks';
import { useRooms } from '../../hooks/useRooms';
import { getAllShiftBlocksForWeek } from '../../utils/eventUtils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface SessionAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNextMonday(today: Date): Date {
  const dayOfWeek = today.getDay();
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
}

function formatShortDay(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatTimeLabel(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Helper to convert 'HH:MM:SS' or 'HH:MM' to 'HH:MM'
function toHHMM(t: string | null | undefined): string {
  if (!t) return '06:00';
  return t.split(':').slice(0, 2).join(':');
}

const SessionAssignmentsModal: React.FC<SessionAssignmentsModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const { profiles, isLoading: profilesLoading, error: profilesError } = useUserProfiles();
  const { rooms: allRooms, isLoading: roomsLoading } = useRooms();

  const today = new Date();
  // Tab state: 'this' or 'next'
  const [weekTab, setWeekTab] = useState<'this' | 'next'>('next');
  const [selectedDay, setSelectedDay] = useState(0);

  // Calculate this week's Monday
  function getThisMonday(today: Date): Date {
    const dayOfWeek = today.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysSinceMonday);
    thisMonday.setHours(0,0,0,0);
    return thisMonday;
  }

  const thisMonday = getThisMonday(today);
  const nextMonday = getNextMonday(today);
  const weekStartDate = weekTab === 'this' ? thisMonday : nextMonday;
  const weekStart = weekStartDate.toISOString().split('T')[0];
  const followingSunday = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(weekStartDate.getDate() + i);
    return d;
  });

  // Shifts
  const { data: shifts, isLoading: shiftsLoading, error: shiftsError } = useShifts(weekStart);
  const upsertShift = useUpsertShift();
  const updateShiftBlocks = useUpdateShiftBlocks();
  const copyShiftBlocks = useCopyShiftBlocks();
  const copyShiftsFromPreviousWeek = useCopyShiftsFromPreviousWeek();
  const queryClient = useQueryClient();

  // Fetch all shift blocks for the week
  const { data: allShiftBlocks = [], isLoading: shiftBlocksLoading } = useQuery({
    queryKey: ['allShiftBlocks', weekStart],
    queryFn: () => getAllShiftBlocksForWeek(weekStart),
    enabled: !!weekStart,
  });

  // Utility: For a given day, are all rooms assigned in EVERY shift block?
  function allRoomsAssignedForDay(dayIdx: number): boolean {
    if (!allRooms || !allShiftBlocks) return false;
    const blocksForDay = allShiftBlocks.filter((b: any) => b.day_of_week === dayIdx);
    if (blocksForDay.length === 0) return false;
    
    // All room names (ignore null/empty)
    const roomNames = allRooms.filter((n): n is string => !!n);
    
    // Check EACH shift block individually - ALL must have ALL rooms assigned
    const blockResults = blocksForDay.map((block: any) => {
      const assignedRoomsInBlock = new Set<string>();
      
      if (block.assignments && Array.isArray(block.assignments)) {
        for (const assignment of block.assignments) {
          if (
            assignment &&
            typeof assignment === 'object' &&
            'rooms' in assignment &&
            Array.isArray((assignment as any).rooms)
          ) {
            (assignment as any).rooms.forEach((room: string) => assignedRoomsInBlock.add(room));
          }
        }
      }
      
      const allRoomsAssignedInThisBlock = roomNames.every((r: string) => assignedRoomsInBlock.has(r));
      
      return {
        blockId: block.id,
        startTime: block.start_time,
        endTime: block.end_time,
        assignedRooms: assignedRoomsInBlock.size,
        missingRooms: roomNames.filter((r: string) => !assignedRoomsInBlock.has(r)),
        allAssigned: allRoomsAssignedInThisBlock
      };
    });
    
    // ALL blocks must have ALL rooms assigned
    const result = blockResults.every(block => block.allAssigned);
    
    return result;
  }

  // Modal state
  const [editingCell, setEditingCell] = useState<{ profileId: string, dayIdx: number } | null>(null);
  const [modalStart, setModalStart] = useState<string>('06:00');
  const [modalEnd, setModalEnd] = useState<string>('07:00');
  
  // Loading state for copy schedule operation
  const [isCopyingSchedule, setIsCopyingSchedule] = useState(false);

  // Open modal with current shift values if present
  const openCellModal = (profileId: string, dayIdx: number) => {
    const shift = shifts?.find(s => s.profile_id === profileId && s.day_of_week === dayIdx && s.week_start === weekStart);
    setModalStart(toHHMM(shift?.start_time) || '06:00');
    setModalEnd(toHHMM(shift?.end_time) || '07:00');
    setEditingCell({ profileId, dayIdx });
  };

  const closeCellModal = () => setEditingCell(null);

  const handleSave = () => {
    if (!editingCell) return;
    upsertShift.mutate({
      profile_id: editingCell.profileId,
      day_of_week: editingCell.dayIdx,
      week_start: weekStart,
      start_time: modalStart,
      end_time: modalEnd,
    }, {
      onSuccess: () => {
        // After shift is saved, recalculate shift blocks for that day
        const dayIdx = editingCell.dayIdx;
        const shiftsForDay = (shifts || []).filter(s => s.day_of_week === dayIdx && s.week_start === weekStart);
        // Add or update the just-saved shift in the list
        const prev = shifts?.find(s => s.profile_id === editingCell.profileId && s.day_of_week === dayIdx && s.week_start === weekStart);
        const updatedShifts = [
          ...shiftsForDay.filter(s => s.profile_id !== editingCell.profileId),
          {
            id: prev?.id ?? 0,
            created_at: prev?.created_at ?? '',
            profile_id: editingCell.profileId ?? '',
            day_of_week: dayIdx,
            week_start: weekStart ?? '',
            start_time: modalStart ?? '',
            end_time: modalEnd ?? '',
          }
        ];
        const newBlocks = calculateNewShiftBlocks(updatedShifts, dayIdx, weekStart);
        updateShiftBlocks.mutate({ day_of_week: dayIdx, week_start: weekStart, newBlocks });
        closeCellModal();
      },
      onError: (error) => {
        console.error('Shift upsert error:', error);
      }
    });
  };

  // Time options (30-min increments from 6:00 to 23:00)
  const timeOptions: string[] = [];
  for (let h = 6; h <= 23; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`);
    if (h !== 23) timeOptions.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // Utility to get shift for a cell
  const getShift = (profileId: string, dayIdx: number): Shift | undefined =>
    shifts?.find(s => s.profile_id === profileId && s.day_of_week === dayIdx && s.week_start === weekStart);

  // Handler for copying shift blocks to days with same schedule
  const handleCopyShiftBlocks = () => {
    copyShiftBlocks.mutate({
      sourceDayOfWeek: selectedDay,
      weekStart: weekStart,
    }, {
      onSuccess: (result) => {
        console.log(`✅ Copied shift blocks to ${result.matchingDays.length} matching days:`, result.matchingDays);
      },
      onError: (error) => {
        console.error('❌ Failed to copy shift blocks:', error);
      }
    });
  };

  // Handler for copying schedule from previous week
  const handleCopyScheduleFromLastWeek = () => {
    // Calculate previous week based on current tab
    const currentWeekStart = weekTab === 'this' ? thisMonday : nextMonday;
    const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekStartString = previousWeekStart.toISOString().split('T')[0];
    
    setIsCopyingSchedule(true);
    
    copyShiftsFromPreviousWeek.mutate({
      sourceWeekStart: previousWeekStartString,
      targetWeekStart: weekStart,
    }, {
      onSuccess: async (result) => {
        console.log(`✅ Copied ${result.copiedShifts} shifts from previous week`);
        
        // After copying shifts, also copy shift blocks from previous week using enhanced mutations
        setTimeout(async () => {
          try {
            // Fetch shift blocks from the previous week grouped by day
            const { data: sourceShiftBlocks } = await supabase
              .from('shift_blocks')
              .select('*')
              .eq('week_start', previousWeekStartString);
            
            if (sourceShiftBlocks && sourceShiftBlocks.length > 0) {
              // Group blocks by day of week
              const blocksByDay = sourceShiftBlocks.reduce((acc, block) => {
                const day = block.day_of_week!;
                if (!acc[day]) acc[day] = [];
                acc[day].push({
                  day_of_week: day,
                  week_start: weekStart,
                  start_time: block.start_time,
                  end_time: block.end_time,
                  assignments: block.assignments,
                });
                return acc;
              }, {} as Record<number, any[]>);
              
              // Use enhanced mutations to copy blocks for each day (includes event synchronization)
              const copyPromises = Object.entries(blocksByDay).map(([dayStr, blocks]) => {
                const day = parseInt(dayStr);
                return updateShiftBlocks.mutateAsync({
                  day_of_week: day,
                  week_start: weekStart,
                  newBlocks: blocks
                });
              });
              
              await Promise.all(copyPromises);
              
              console.log(`✅ Copied ${sourceShiftBlocks.length} shift blocks from previous week with event synchronization`);
            } else {
              console.log('No shift blocks found for previous week');
            }
            
            // End loading state
            setIsCopyingSchedule(false);
          } catch (error) {
            console.error('❌ Failed to copy shift blocks:', error);
            setIsCopyingSchedule(false);
          }
        }, 500); // Small delay to ensure shifts query has refetched
      },
      onError: (error) => {
        console.error('❌ Failed to copy schedule from previous week:', error.message);
        setIsCopyingSchedule(false);
      }
    });
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className={`max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-0 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center px-6 pt-6 pb-2">
            <h2 className="text-2xl font-semibold">Session Assignments</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex justify-center pb-2 gap-2">
            <button
              className={`px-4 py-2 rounded-t-lg font-medium text-sm focus:outline-none transition-colors ${weekTab === 'this' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              onClick={() => setWeekTab('this')}
            >
              This Week
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg font-medium text-sm focus:outline-none transition-colors ${weekTab === 'next' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              onClick={() => setWeekTab('next')}
            >
              Next Week
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="mt-6 px-12 pb-12 min-h-[400px] flex flex-col items-center justify-center relative">
          {/* Copy Schedule Loading Overlay */}
          {isCopyingSchedule && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Copying Schedule</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Copying shifts and room assignments from last week...</p>
                </div>
              </div>
            </div>
          )}
          
          {(profilesLoading || shiftsLoading || roomsLoading || shiftBlocksLoading) && <span className="text-lg text-gray-500 dark:text-gray-300">Loading…</span>}
          {(profilesError || shiftsError) && <span className="text-lg text-red-500">Error loading data</span>}
          
          {!profilesLoading && !shiftsLoading && !profilesError && !shiftsError && (
            <>
              {/* Copy Schedule from Last Week Button */}
              <div className="mb-4 flex justify-center">
                <button
                  onClick={handleCopyScheduleFromLastWeek}
                  disabled={isCopyingSchedule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  {isCopyingSchedule ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Copying schedule and room assignments...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2V8a2 2 0 00-2-2H9a2 2 0 00-2 2v5.172a2 2 0 00.586 1.414l4.414 4.414A2 2 0 0012.828 18H14" />
                      </svg>
                      Copy schedule from last week
                    </>
                  )}
                </button>
              </div>
              
              <div className="overflow-x-auto w-full">
                <table className="min-w-full border border-gray-400 dark:border-gray-600 rounded-lg overflow-hidden table-fixed">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-left border border-gray-400 dark:border-gray-600 w-40">Name</th>
                      {weekDates.map((date, idx) => (
                        <th
                          key={idx}
                          className={`px-2 py-2 text-center border border-gray-400 dark:border-gray-600 cursor-pointer transition-colors ${selectedDay === idx ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                          onClick={() => setSelectedDay(idx)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{formatShortDay(date)}{' '}
                              {allRoomsAssignedForDay(idx) && <span title="All rooms assigned">✅</span>}
                            </span>
                            <span className="text-xs">{formatShortDate(date)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profiles && profiles
                      .filter(profile => profile.role === 'TECHNICIAN')
                      .map(profile => (
                      <tr key={profile.id} className="border-t border-gray-400 dark:border-gray-600">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap border border-gray-400 dark:border-gray-600">{profile.name || profile.id}</td>
                        {weekDates.map((date, dayIdx) => {
                          const shift = getShift(profile.id, dayIdx);
                          return (
                            <td
                              key={dayIdx}
                              className={`px-2 py-2 text-center border border-gray-400 dark:border-gray-600 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors ${selectedDay === dayIdx ? 'bg-purple-100 dark:bg-purple-900/30' : ''}`}
                              onClick={() => openCellModal(profile.id, dayIdx)}
                            >
                              {shift && shift.start_time && shift.end_time
                                ? (
                                    <span className="text-xs text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center">
                                      <span>{formatTimeLabel(shift.start_time)}</span>
                                      <span>{formatTimeLabel(shift.end_time)}</span>
                                    </span>
                                  )
                                : <span className="text-gray-400 text-xs">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <ShiftBlocks weekStart={weekStart} selectedDay={selectedDay} />
              
              {/* Copy Shift Blocks Button */}
              {allRoomsAssignedForDay(selectedDay) && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleCopyShiftBlocks}
                    disabled={copyShiftBlocks.isPending}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium rounded-lg shadow-md transition-colors flex items-center gap-2"
                  >
                    {copyShiftBlocks.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Copying...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Shiftblocks to days with same schedule
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Time Range Picker Modal */}
        {editingCell && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[10000]" onClick={closeCellModal}>
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-xs mx-4`} onClick={e => e.stopPropagation()}>
              <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Set Time Range</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <select
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={modalStart}
                  onChange={e => setModalStart(e.target.value)}
                  disabled={upsertShift.isPending}
                >
                  {timeOptions.map(opt => (
                    <option key={opt} value={opt}>{formatTimeLabel(opt)}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">End Time</label>
                <select
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={modalEnd}
                  onChange={e => setModalEnd(e.target.value)}
                  disabled={upsertShift.isPending}
                >
                  {timeOptions.map(opt => (
                    <option key={opt} value={opt}>{formatTimeLabel(opt)}</option>
                  ))}
                </select>
              </div>
              {upsertShift.isError && (
                <div className="mb-2 text-red-600 text-sm">
                  Error saving shift. Please try again.
                </div>
              )}
              {(upsertShift.isPending || updateShiftBlocks.isPending) && (
                <div className="mt-2 text-purple-600 text-sm flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Updating shift blocks…
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeCellModal}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  disabled={upsertShift.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
                  disabled={upsertShift.isPending}
                >
                  {upsertShift.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              isDarkMode 
                ? 'text-gray-300 hover:text-gray-100' 
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionAssignmentsModal; 