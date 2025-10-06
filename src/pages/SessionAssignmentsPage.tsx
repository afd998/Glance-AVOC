import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfiles } from '../core/User/useUserProfiles';
import { useShifts, useCopyScheduleFromPreviousWeek } from '../features/SessionAssignments/hooks/useShifts';
import { useCopyShiftBlocksToDaysWithSameSchedule } from '../features/SessionAssignments/hooks/useCopyShiftBlocksToDaysWithSameSchedule';
import ShiftBlocks from '../features/SessionAssignments/ShiftBlocks/ShiftBlocks';
import SessionAssignmentSchedule from '../features/SessionAssignments/SessionAssignmentSchedule';
import { useRooms } from '../core/Rooms/useRooms';
import { getAllShiftBlocksForDate } from '../utils/eventUtils';
import { Button } from '../components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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


  // Sonner handles toasts globally; no local state needed



  // Handler for copying shift blocks to days with same schedule
  const handleCopyShiftBlocks = () => {
    const sourceDate = weekDates[selectedDay].toISOString().split('T')[0];
    
    setIsCopyingShiftBlocks(true);
    
    copyShiftBlocksToDaysWithSameSchedule.mutate(sourceDate, {
      onSuccess: (result) => {
        console.log(`✅ Copied shift blocks to ${result.copiedDays} days with same schedule`);
        toast.success(`Copied shift blocks to ${result.copiedDays} day(s).`);
        setIsCopyingShiftBlocks(false);
      },
      onError: (error) => {
        console.error('❌ Failed to copy shift blocks:', error);
        toast.error(error.message || 'Failed to copy shift blocks. Please try again.');
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
    <div className="min-h-screen bg-background px-24">
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
          {/* Toasts handled by Sonner; no local inline toast UI */}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyScheduleFromLastWeek}
                  disabled={isCopyingSchedule}
                  className=""
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
                      <ArrowRight className="w-4 h-4" />
                      Copy schedule from last week into this week
                    </>
                  )}
                </Button>
                
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
                onCopyShiftBlocks={handleCopyShiftBlocks}
                isCopyingShiftBlocks={isCopyingShiftBlocks}
              />
              
              <div className="w-full max-w-full overflow-hidden">
                <ShiftBlocks date={selectedDate} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionAssignmentsPage; 