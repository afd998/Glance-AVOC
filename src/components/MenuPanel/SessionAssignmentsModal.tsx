import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { useShifts, useCreateShift, useCopyShifts, useCopyScheduleFromPreviousWeek, Shift } from '../../hooks/useShifts';
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
  const copyScheduleFromPreviousWeek = useCopyScheduleFromPreviousWeek();
  const queryClient = useQueryClient();



  // Modal state
  const [editingCell, setEditingCell] = useState<{ profileId: string, dayIdx: number } | null>(null);
  const [modalStart, setModalStart] = useState<string>('06:00');
  const [modalEnd, setModalEnd] = useState<string>('07:00');
  
  // Loading state for copy schedule operation
  const [isCopyingSchedule, setIsCopyingSchedule] = useState(false);
  // Loading state for copy shift blocks operation
  const [isCopyingShiftBlocks, setIsCopyingShiftBlocks] = useState(false);


  // Lightweight toast for copy shift blocks feedback
  const [copyToast, setCopyToast] = useState<null | { type: 'success' | 'error' | 'info'; text: string }>(null);
  useEffect(() => {
    if (!copyToast) return;
    const t = setTimeout(() => setCopyToast(null), 3000);
    return () => clearTimeout(t);
  }, [copyToast]);

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
      onSuccess: async (data) => {
        // Get fresh shifts for the day from the existing data
        const latestShiftsForDay = shifts?.filter(shift => shift.date === dateForDay) || [];
        const newBlocks = calculateNewShiftBlocks(latestShiftsForDay, dateForDay);
        await updateShiftBlocks.mutateAsync({ date: dateForDay, newBlocks });

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

  // Helper function to compare if two days have the same shift schedule
  const hasSameShiftSchedule = (date1: string, date2: string): boolean => {
    if (!shifts) return false;
    
    const shifts1 = shifts.filter(s => s.date === date1);
    const shifts2 = shifts.filter(s => s.date === date2);
    
    if (shifts1.length !== shifts2.length) return false;
    
    // Create a normalized schedule string for comparison
    const normalizeSchedule = (shifts: any[]) => {
      return shifts
        .map(s => `${s.profile_id}:${s.start_time}-${s.end_time}`)
        .sort()
        .join('|');
    };
    
    return normalizeSchedule(shifts1) === normalizeSchedule(shifts2);
  };

  // Handler for copying shift blocks to days with same schedule
  const handleCopyShiftBlocks = () => {
    const sourceDate = weekDates[selectedDay].toISOString().split('T')[0];
    
    // Find all other days in the week that have the same shift schedule
    const daysWithSameSchedule = weekDates
      .map(date => date.toISOString().split('T')[0])
      .filter(date => date !== sourceDate && hasSameShiftSchedule(sourceDate, date));
    
    if (daysWithSameSchedule.length === 0) {
      console.log('No other days found with the same schedule');
      setCopyToast({ type: 'info', text: "No other days have the same shift schedule." });
      return;
    }
    
    console.log(`Found ${daysWithSameSchedule.length} days with same schedule:`, daysWithSameSchedule);
    
    setIsCopyingShiftBlocks(true);
    
    // Copy shift blocks to all days with the same schedule
    const copyPromises = daysWithSameSchedule.map(targetDate =>
      copyShiftBlocks.mutateAsync({
        sourceDate: sourceDate,
        targetDate: targetDate,
      })
    );
    
    Promise.all(copyPromises)
      .then(() => {
        console.log(`✅ Copied shift blocks to ${daysWithSameSchedule.length} days with same schedule`);
        setCopyToast({ type: 'success', text: `Copied shift blocks to ${daysWithSameSchedule.length} day(s).` });
        setIsCopyingShiftBlocks(false);
      })
      .catch((error) => {
        console.error('❌ Failed to copy shift blocks:', error);
        setCopyToast({ type: 'error', text: 'Failed to copy shift blocks. Please try again.' });
        setIsCopyingShiftBlocks(false);
      });
  };

  // Removed cleanup handler; enforce correctness at source

  // Handler for copying schedule from previous week
  const handleCopyScheduleFromLastWeek = () => {
    // Calculate previous week based on the currently displayed week
    const currentWeekStartDate = new Date(weekStart + 'T00:00:00');
    const previousWeekStartDate = new Date(currentWeekStartDate);
    previousWeekStartDate.setDate(previousWeekStartDate.getDate() - 7);
    
    setIsCopyingSchedule(true);
    
    copyScheduleFromPreviousWeek.mutate({
      weekDates,
      previousWeekStartDate
    }, {
      onSuccess: () => {
        setIsCopyingSchedule(false);
      },
      onError: (error) => {
        console.error('Failed to copy schedule from previous week:', error);
        setIsCopyingSchedule(false);
      }
    });
  };

  
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
        <div 
          className={`max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto rounded-xl shadow-2xl backdrop-blur-xl border ${
            isDarkMode 
              ? 'bg-gray-900/10 text-white border-white/20' 
              : 'bg-white/10 text-gray-900 border-gray-300/20'
          }`}
          onClick={e => e.stopPropagation()}
        >
        {/* Header */}
        <div className={`flex flex-col gap-0 border-b backdrop-blur-sm ${
          isDarkMode 
            ? 'border-white/10 bg-gray-800/5' 
            : 'border-gray-200/20 bg-white/5'
        }`}>
          <div className="flex justify-between items-center px-6 pt-6 pb-2">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Session Assignments</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex justify-center pb-2 gap-2">
            <button
              className={`px-4 py-2 rounded-t-lg font-medium text-sm focus:outline-none transition-all duration-200 ${weekTab === 'this' ? 'bg-purple-600/90 text-white backdrop-blur-sm' : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 backdrop-blur-sm hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
              onClick={() => setWeekTab('this')}
            >
              This Week
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg font-medium text-sm focus:outline-none transition-all duration-200 ${weekTab === 'next' ? 'bg-purple-600/90 text-white backdrop-blur-sm' : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 backdrop-blur-sm hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
              onClick={() => setWeekTab('next')}
            >
              Next Week
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="mt-6 px-12 pb-12 min-h-[400px] flex flex-col relative">
          {/* Local toast for copy shift blocks */}
          {copyToast && (
            <div className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-md shadow-md text-sm flex items-center gap-2 
              ${copyToast.type === 'success' ? 'bg-green-600 text-white' : ''}
              ${copyToast.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${copyToast.type === 'info' ? 'bg-gray-800 text-white' : ''}
            `}>
              {copyToast.type === 'success' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              {copyToast.type === 'error' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              {copyToast.type === 'info' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              )}
              <span>{copyToast.text}</span>
            </div>
          )}
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
          
          {(profilesLoading || shiftsLoading || roomsLoading ) && <span className="text-lg text-gray-500 dark:text-gray-300">Loading…</span>}
          {(profilesError || shiftsError) && <span className="text-lg text-red-500">Error loading data</span>}
          
          {!profilesLoading && !shiftsLoading && !profilesError && !shiftsError && (
            <>
                             {/* Copy Schedule from Last Week Button */}
               <div className="mb-4 flex justify-start gap-4">
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
                
                {/* Cleanup button removed */}
              </div>

              
              <div className="overflow-x-auto w-full">
                <table className="min-w-full border border-gray-400/30 dark:border-gray-600/30 rounded-xl overflow-hidden table-fixed backdrop-blur-sm bg-white/5 dark:bg-gray-800/5">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 bg-gray-200/20 dark:bg-gray-700/20 backdrop-blur-sm text-left border border-gray-400/30 dark:border-gray-600/30 w-40">Name</th>
                      {weekDates.map((date, idx) => (
                        <th
                          key={idx}
                          className={`px-2 py-2 text-center border border-gray-400/30 dark:border-gray-600/30 cursor-pointer transition-all duration-200 ${selectedDay === idx ? 'bg-purple-600/90 text-white backdrop-blur-sm' : 'bg-gray-200/20 dark:bg-gray-700/20 text-gray-700 dark:text-gray-200 backdrop-blur-sm hover:bg-gray-300/30 dark:hover:bg-gray-600/30'}`}
                          onClick={() => setSelectedDay(idx)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{formatShortDay(date)}{' '}
                            </span>
                            <span className="text-xs">{formatShortDate(date)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profiles && profiles
                      .filter(profile => 
                        profile.roles && 
                        Array.isArray(profile.roles) && 
                        profile.roles.includes('TECHNICIAN')
                      )
                      .map(profile => (
                      <tr key={profile.id} className="border-t border-gray-400 dark:border-gray-600">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap border border-gray-400/30 dark:border-gray-600/30 bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm">{profile.name || profile.id}</td>
                        {weekDates.map((date, dayIdx) => {
                          const shift = getShift(profile.id, dayIdx);
                          return (
                            <td
                              key={dayIdx}
                              className={`px-2 py-2 text-center border border-gray-400/30 dark:border-gray-600/30 cursor-pointer hover:bg-purple-100/30 dark:hover:bg-purple-900/15 transition-all duration-200 backdrop-blur-sm ${selectedDay === dayIdx ? 'bg-purple-100/30 dark:bg-purple-900/15' : 'bg-white/5 dark:bg-gray-800/5'}`}
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
              {false && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleCopyShiftBlocks}
                    disabled={isCopyingShiftBlocks}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium rounded-lg shadow-md transition-colors flex items-center gap-2"
                  >
                    {isCopyingShiftBlocks ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Copying shift blocks...
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
            <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-300/50 dark:border-gray-700/50 rounded-xl shadow-2xl p-8 w-full max-w-xs mx-4`} onClick={e => e.stopPropagation()}>
              <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Set Time Range</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <select
                  className="w-full p-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
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
                  className="w-full p-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
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
                       onSuccess: async () => {
                          // Get fresh shifts for the day from the existing data
                          const latestShiftsForDay = shifts?.filter(shift => shift.date === dateForDay) || [];
                          const newBlocks = calculateNewShiftBlocks(latestShiftsForDay, dateForDay);
                          await updateShiftBlocks.mutateAsync({ date: dateForDay, newBlocks });

                          // Refresh queries so UI shows latest shifts and blocks
                          queryClient.invalidateQueries({ queryKey: ['shifts'] });
                          queryClient.invalidateQueries({ queryKey: ['shift_blocks', dateForDay] });

                         closeCellModal();
                       },
                       onError: (error) => {
                         console.error('Shift clear error:', error);
                       }
                     });
                   }}
                   className="px-4 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm hover:bg-red-200/80 dark:hover:bg-red-900/50 transition-all duration-200 border border-red-300/50 dark:border-red-700/50"
                   disabled={createShift.isPending}
                 >
                   Clear
                 </button>
                 <div className="flex space-x-2">
                   <button
                     onClick={closeCellModal}
                     className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-gray-300/80 dark:hover:bg-gray-600/80 transition-all duration-200 border border-gray-300/50 dark:border-gray-600/50"
                     disabled={createShift.isPending}
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleSave}
                     className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-purple-600/90 backdrop-blur-sm hover:bg-purple-700/90 disabled:opacity-60 transition-all duration-200 border border-purple-500/50"
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
        <div className={`p-6 border-t backdrop-blur-sm ${
          isDarkMode 
            ? 'border-white/10 bg-gray-800/5' 
            : 'border-gray-200/20 bg-white/5'
        }`}>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white bg-gray-700/30 hover:bg-gray-600/40 border-white/10 hover:border-white/20' 
                  : 'text-gray-700 hover:text-gray-900 bg-white/30 hover:bg-white/50 border-gray-200/30 hover:border-gray-300/50'
              }`}
            >
              Close
            </button>
          </div>
        </div>
        </div>
      </div>
  );
};

export default SessionAssignmentsModal; 