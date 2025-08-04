import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { useShifts, useCreateShift, useCopyShifts, Shift } from '../../hooks/useShifts';
import { supabase } from '../../lib/supabase';
import { calculateNewShiftBlocks, useUpdateShiftBlocks, useCopyShiftBlocks } from '../../hooks/useShiftBlocks';
import ShiftBlocks from './ShiftBlocks';
import { useRooms } from '../../hooks/useRooms';
import { getAllShiftBlocksForDate } from '../../utils/eventUtils';
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
  
  // Use local date calculation to avoid timezone issues
  const weekStart = weekStartDate.getFullYear() + '-' + 
    String(weekStartDate.getMonth() + 1).padStart(2, '0') + '-' + 
    String(weekStartDate.getDate()).padStart(2, '0');
  const followingSunday = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(weekStartDate.getDate() + i);
    return d;
  });

  // Shifts - now using specific dates instead of week-based approach
  const selectedDate = weekDates[selectedDay].toISOString().split('T')[0];
  
  // Fetch shifts for all days in the week, not just the selected day
  const allWeekDates = weekDates.map(date => date.toISOString().split('T')[0]);
  const { data: shifts, isLoading: shiftsLoading, error: shiftsError } = useShifts(allWeekDates);
  
  const createShift = useCreateShift();
  const updateShiftBlocks = useUpdateShiftBlocks();
  const copyShiftBlocks = useCopyShiftBlocks();
  const copyShifts = useCopyShifts();
  const queryClient = useQueryClient();

  // Fetch all shift blocks for all days in the week
  const { data: allShiftBlocks = [], isLoading: shiftBlocksLoading } = useQuery({
    queryKey: ['allShiftBlocks', allWeekDates],
    queryFn: async () => {
      const allBlocks = [];
      for (const date of allWeekDates) {
        const blocks = await getAllShiftBlocksForDate(date);
        allBlocks.push(...blocks);
      }
      return allBlocks;
    },
    enabled: allWeekDates.length > 0,
  });

  // Utility: For a given day, are all rooms assigned in EVERY shift block?
  function allRoomsAssignedForDay(dayIdx: number): boolean {
    if (!allRooms || !allShiftBlocks) return false;
    const dateForDay = weekDates[dayIdx].toISOString().split('T')[0];
    const blocksForDay = allShiftBlocks.filter((b: any) => b.date === dateForDay);
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
    const dateForDay = weekDates[dayIdx].toISOString().split('T')[0];
    const shift = shifts?.find(s => s.profile_id === profileId && s.date === dateForDay);
    setModalStart(toHHMM(shift?.start_time) || '06:00');
    setModalEnd(toHHMM(shift?.end_time) || '07:00');
    setEditingCell({ profileId, dayIdx });
  };

  const closeCellModal = () => setEditingCell(null);

  const handleSave = () => {
    if (!editingCell) return;
    const dateForDay = weekDates[editingCell.dayIdx].toISOString().split('T')[0];
    
    createShift.mutate({
      profile_id: editingCell.profileId,
      date: dateForDay,
      start_time: modalStart,
      end_time: modalEnd,
    }, {
      onSuccess: (data) => {
        // After shift is saved, recalculate shift blocks for that day
        const dayIdx = editingCell.dayIdx;
        const shiftsForDay = (shifts || []).filter(s => s.date === dateForDay);
        // Add or update the just-saved shift in the list
        const prev = shifts?.find(s => s.profile_id === editingCell.profileId && s.date === dateForDay);
        const updatedShifts = [
          ...shiftsForDay.filter(s => s.profile_id !== editingCell.profileId),
          {
            id: prev?.id ?? 0,
            created_at: prev?.created_at ?? '',
            profile_id: editingCell.profileId ?? '',
            date: dateForDay,
            start_time: modalStart ?? '',
            end_time: modalEnd ?? '',
          }
        ];
        const newBlocks = calculateNewShiftBlocks(updatedShifts, dateForDay);
        updateShiftBlocks.mutate({ date: dateForDay, newBlocks });
        closeCellModal();
      },
      onError: (error) => {
        console.error('Shift create error:', error);
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
  const getShift = (profileId: string, dayIdx: number): Shift | undefined => {
    const dateForDay = weekDates[dayIdx].toISOString().split('T')[0];
    const shift = shifts?.find(s => s.profile_id === profileId && s.date === dateForDay);
    
    return shift;
  };

  // Handler for copying shift blocks to days with same schedule
  const handleCopyShiftBlocks = () => {
    const sourceDate = weekDates[selectedDay].toISOString().split('T')[0];
    copyShiftBlocks.mutate({
      sourceDate: sourceDate,
      targetDate: sourceDate, // This would need to be updated to copy to other dates
    }, {
      onSuccess: (result) => {
        console.log(`✅ Copied shift blocks to other dates`);
      },
      onError: (error) => {
        console.error('❌ Failed to copy shift blocks:', error);
      }
    });
  };

  // Handler for copying schedule from previous week
  const handleCopyScheduleFromLastWeek = () => {
    // Calculate previous week based on the currently displayed week
    const currentWeekStartDate = new Date(weekStart + 'T00:00:00');
    const previousWeekStartDate = new Date(currentWeekStartDate);
    previousWeekStartDate.setDate(previousWeekStartDate.getDate() - 7);
    
    setIsCopyingSchedule(true);
    
    // First, delete all existing shifts and shift blocks for the target week
    const deletePromises = weekDates.map(async (targetDate) => {
      const targetDateString = targetDate.toISOString().split('T')[0];
      
      try {
        // Delete all shifts for this date
        const { error: shiftsDeleteError } = await supabase
          .from('shifts')
          .delete()
          .eq('date', targetDateString);
        
        if (shiftsDeleteError) throw shiftsDeleteError;
        
        // Delete all shift blocks for this date
        const { error: blocksDeleteError } = await supabase
          .from('shift_blocks')
          .delete()
          .eq('date', targetDateString);
        
        if (blocksDeleteError) throw blocksDeleteError;
      } catch (error) {
        console.error(`Failed to delete existing data for ${targetDateString}:`, error);
        throw error;
      }
    });
    
    // After deleting, copy the new schedule
    Promise.all(deletePromises)
      .then(() => {
        // Copy shifts and blocks for each day of the week
        const copyPromises = weekDates.map(async (targetDate, dayIdx) => {
          const sourceDate = new Date(previousWeekStartDate);
          sourceDate.setDate(previousWeekStartDate.getDate() + dayIdx);
          const sourceDateString = sourceDate.toISOString().split('T')[0];
          const targetDateString = targetDate.toISOString().split('T')[0];
          
          try {
            // Copy shifts for this day
            await copyShifts.mutateAsync({
              sourceDate: sourceDateString,
              targetDate: targetDateString,
            });
            
            // Copy shift blocks for this day
            await copyShiftBlocks.mutateAsync({
              sourceDate: sourceDateString,
              targetDate: targetDateString,
            });
          } catch (error) {
            console.error(`Failed to copy schedule for ${targetDateString}:`, error);
          }
        });
        
        return Promise.all(copyPromises);
      })
      .then(() => {
        setIsCopyingSchedule(false);
        
        // Force a refetch of the current week's data
        queryClient.invalidateQueries({ 
          queryKey: ['shifts'], 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'shifts' && Array.isArray(queryKey[1]);
          }
        });
        queryClient.invalidateQueries({ queryKey: ['allShiftBlocks'] });
      })
      .catch((error) => {
        console.error('Failed to copy schedule from previous week:', error);
        setIsCopyingSchedule(false);
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
        <div className="mt-6 px-12 pb-12 min-h-[400px] flex flex-col relative">
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
               <div className="mb-4 flex justify-start">
                 <button
                   onClick={handleCopyScheduleFromLastWeek}
                   disabled={isCopyingSchedule}
                   className="px-2 py-1 text-blue-600 hover:text-blue-700 disabled:opacity-60 text-sm transition-colors flex items-center gap-2 underline"
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
                      Copy schedule from last week into this week
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
              
              <ShiftBlocks date={selectedDate} />
              
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
                  disabled={createShift.isPending}
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
                  disabled={createShift.isPending}
                >
                  {timeOptions.map(opt => (
                    <option key={opt} value={opt}>{formatTimeLabel(opt)}</option>
                  ))}
                </select>
              </div>
              {createShift.isError && (
                <div className="mb-2 text-red-600 text-sm">
                  Error saving shift. Please try again.
                </div>
              )}
              {(createShift.isPending || updateShiftBlocks.isPending) && (
                <div className="mt-2 text-purple-600 text-sm flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Updating shift blocks…
                </div>
              )}
                             <div className="flex justify-between">
                 <button
                   onClick={() => {
                     // Clear the shift by setting times to null
                     const dateForDay = weekDates[editingCell.dayIdx].toISOString().split('T')[0];
                     createShift.mutate({
                       profile_id: editingCell.profileId,
                       date: dateForDay,
                       start_time: null,
                       end_time: null,
                     }, {
                                               onSuccess: () => {
                          // After shift is cleared, recalculate shift blocks for that day
                          const dayIdx = editingCell.dayIdx;
                          const shiftsForDay = (shifts || []).filter(s => s.date === dateForDay);
                          // Remove the cleared shift from the list
                          const updatedShifts = shiftsForDay.filter(s => s.profile_id !== editingCell.profileId);
                          const newBlocks = calculateNewShiftBlocks(updatedShifts, dateForDay);
                          updateShiftBlocks.mutate({ date: dateForDay, newBlocks });
                          closeCellModal();
                        },
                       onError: (error) => {
                         console.error('Shift clear error:', error);
                       }
                     });
                   }}
                   className="px-4 py-2 text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                   disabled={createShift.isPending}
                 >
                   Clear
                 </button>
                 <div className="flex space-x-2">
                   <button
                     onClick={closeCellModal}
                     className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                     disabled={createShift.isPending}
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleSave}
                     className="px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
                     disabled={createShift.isPending}
                   >
                     {createShift.isPending ? 'Saving...' : 'Save'}
                   </button>
                 </div>
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