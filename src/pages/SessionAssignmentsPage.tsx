import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfiles } from '../core/User/useUserProfiles';
import { useShifts, useCopyScheduleFromPreviousWeek } from '../features/SessionAssignments/hooks/useShifts';
import { useCopyShiftBlocksToDaysWithSameSchedule } from '../features/SessionAssignments/hooks/useCopyShiftBlocksToDaysWithSameSchedule';
import ShiftBlocks from '../features/SessionAssignments/ShiftBlocks/ShiftBlocks';
import SessionAssignmentSchedule from '../features/SessionAssignments/SessionAssignmentSchedule';
import { useRooms } from '../core/Rooms/useRooms';
import { getAllShiftBlocksForDate } from '../utils/eventUtils';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../contexts/HeaderContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';




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


const SessionAssignmentsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { setHeaderContent } = useHeader();
  const { profiles, isLoading: profilesLoading, error: profilesError } = useUserProfiles();
  const { rooms: allRooms, isLoading: roomsLoading } = useRooms();

  // Set header content
  useEffect(() => {
    setHeaderContent(
      <h1 className="text-lg font-semibold text-foreground">
        Session Assignments
      </h1>
    );

    // Cleanup when component unmounts
    return () => setHeaderContent(null);
  }, [setHeaderContent]);
  


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

  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      
        
      {/* Content */}
      <div className="p-6">
        {/* Week Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs value={weekTab} onValueChange={(value) => setWeekTab(value as 'this' | 'next')} className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="this">This Week</TabsTrigger>
              <TabsTrigger value="next">Next Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="min-h-[400px] max-w-full flex flex-col overflow-hidden">
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
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
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
                className="w-full max-w-full"
              />
              
              <div className="w-full max-w-full overflow-hidden">
                <ShiftBlocks date={selectedDate} />
              </div>
              
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
      </div>
    </div>
  );
};

export default SessionAssignmentsPage; 