import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfiles } from '../../core/User/useUserProfiles';
import { useShifts, useCopyScheduleFromPreviousWeek } from './hooks/useShifts';
import { useCopyShiftBlocksToDaysWithSameSchedule } from './hooks/useCopyShiftBlocksToDaysWithSameSchedule';
import ShiftBlocks from './ShiftBlocks/ShiftBlocks';
import SessionAssignmentSchedule from './SessionAssignmentSchedule';
import { useRooms } from '../../core/Rooms/useRooms';
import { getAllShiftBlocksForDate } from '../../utils/eventUtils';


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
  const copyShiftBlocksToDaysWithSameSchedule = useCopyShiftBlocksToDaysWithSameSchedule();
  const copyScheduleFromPreviousWeek = useCopyScheduleFromPreviousWeek();




  
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



  // Handler for copying shift blocks to days with same schedule
  const handleCopyShiftBlocks = () => {
    const sourceDate = weekDates[selectedDay].toISOString().split('T')[0];
    
    setIsCopyingShiftBlocks(true);
    
    copyShiftBlocksToDaysWithSameSchedule.mutate(sourceDate, {
      onSuccess: (result) => {
        console.log(`✅ Copied shift blocks to ${result.copiedDays} days with same schedule`);
        setCopyToast({ type: 'success', text: `Copied shift blocks to ${result.copiedDays} day(s).` });
        setIsCopyingShiftBlocks(false);
      },
      onError: (error) => {
        console.error('❌ Failed to copy shift blocks:', error);
        setCopyToast({ type: 'error', text: error.message || 'Failed to copy shift blocks. Please try again.' });
        setIsCopyingShiftBlocks(false);
      }
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

              
              <SessionAssignmentSchedule 
                dates={allWeekDates}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  const dayIndex = allWeekDates.indexOf(date);
                  if (dayIndex !== -1) {
                    setSelectedDay(dayIndex);
                  }
                }}
                className="w-full"
              />
              
              <ShiftBlocks date={selectedDate} />
              
              {/* Copy Shift Blocks Button */}
              {true && (
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