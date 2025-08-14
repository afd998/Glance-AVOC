import React, { useMemo, useState, useEffect } from 'react';
import { Database } from '../../types/supabase';
import { usePanoptoChecks } from '../../hooks/usePanoptoChecks';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { Video, Clock, CheckCircle, Circle, AlertCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { getEventThemeColors } from '../../utils/eventUtils';

type Event = Database['public']['Tables']['events']['Row'];

interface PanoptoProps {
  event: Event;
}

interface PanoptoCheckTimeline {
  checkNumber: number;
  scheduledTime: Date;
  dueTime: Date;
  status: 'upcoming' | 'current' | 'overdue' | 'completed';
  canComplete: boolean;
}

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function Panopto({ event }: PanoptoProps) {
  const { activeChecks, completePanoptoCheck, initializeEventChecks, completePanoptoCheckForEvent } = usePanoptoChecks();
  const [completedChecks, setCompletedChecks] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);
  
  // Check if all checks are complete
  const allChecksComplete = useMemo(() => {
    if (isLoading || completedChecks.length === 0) return false;
    
    // Calculate expected number of checks
    let totalChecks = 0;
    if (event.start_time && event.end_time) {
      const eventStart = new Date(`${event.date}T${event.start_time}`);
      const eventEnd = new Date(`${event.date}T${event.end_time}`);
      const eventDuration = eventEnd.getTime() - eventStart.getTime();
      totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);
    }
    
    if (totalChecks === 0) return true; // No checks needed
    
    // Check if all checks are complete
    return completedChecks.slice(0, totalChecks).every(check => check === true);
  }, [completedChecks, event.start_time, event.end_time, event.date, isLoading]);
  
  // Load completion status from database
  useEffect(() => {
    const loadCompletionStatus = async () => {
      try {
        // First initialize the event checks if they don't exist
        await initializeEventChecks(event.id);
        
        // Then load the completion status
        const { data, error } = await supabase
          .from('events')
          .select('panopto_checks')
          .eq('id', event.id)
          .single();
          
        if (error) {
          console.error('Error loading check completion status:', error);
          return;
        }
        
        const checks = (data?.panopto_checks as boolean[] | null) || [];
        setCompletedChecks(checks);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in loadCompletionStatus:', error);
        setIsLoading(false);
      }
    };
    
    loadCompletionStatus();
    
    // Refresh every 30 seconds to pick up changes
    const interval = setInterval(loadCompletionStatus, 30000);
    return () => clearInterval(interval);
  }, [event.id, initializeEventChecks]);
  
  // Calculate expected number of checks for skeleton loading
  const expectedChecks = useMemo(() => {
    if (!event.date || !event.start_time || !event.end_time) return 0;
    
    const eventStart = new Date(`${event.date}T${event.start_time}`);
    const eventEnd = new Date(`${event.date}T${event.end_time}`);
    const eventDuration = eventEnd.getTime() - eventStart.getTime();
    return Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);
  }, [event.date, event.start_time, event.end_time]);

  // Calculate all Panopto checks for this event
  const panoptoTimeline = useMemo((): PanoptoCheckTimeline[] => {
    if (!event.date || !event.start_time || !event.end_time || isLoading) return [];
    
    const eventStart = new Date(`${event.date}T${event.start_time}`);
    const eventEnd = new Date(`${event.date}T${event.end_time}`);
    const eventDuration = eventEnd.getTime() - eventStart.getTime();
    const totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);
    
    if (totalChecks === 0) return [];
    
    const now = new Date();

    
    const checks: PanoptoCheckTimeline[] = [];
    
    for (let i = 0; i < totalChecks; i++) {
      const checkNumber = i + 1;
      const scheduledTime = new Date(eventStart.getTime() + (i * PANOPTO_CHECK_INTERVAL));
      const dueTime = new Date(scheduledTime.getTime() + (5 * 60 * 1000)); // 5 minutes to complete
      
      // Check if this check has been completed (from database)
      const isCompleted = completedChecks[checkNumber - 1] === true;
      
      let status: 'upcoming' | 'current' | 'overdue' | 'completed' = 'upcoming';
      let canComplete = false;
      
      if (isCompleted) {
        status = 'completed';
      } else if (now >= dueTime) {
        status = 'overdue';
        canComplete = true;
      } else if (now >= scheduledTime) {
        status = 'current';
        canComplete = true;
      }
      

      
      checks.push({
        checkNumber,
        scheduledTime,
        dueTime,
        status,
        canComplete
      });
    }
    
    return checks;
  }, [event, activeChecks, completedChecks, isLoading]);
  
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };
  
  const formatTimeDistance = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-black dark:text-white" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'current':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-black dark:text-white';
    }
  };
  
  const handleCompleteCheck = async (checkNumber: number) => {
    if (!event.date) {
      console.error('Event date is required for completing check');
      return;
    }

    const success = await completePanoptoCheckForEvent(event.id, checkNumber, event.date);
    
    if (success) {
      // Refresh the completion status
      const { data, error } = await supabase
        .from('events')
        .select('panopto_checks')
        .eq('id', event.id)
        .single();
        
      if (!error && data) {
        const checks = (data?.panopto_checks as boolean[] | null) || [];
        setCompletedChecks(checks);
      }
    }
  };
  
  // Show loading state first
  if (isLoading) {
    return (
      <div className={`${themeColors.mainBg} rounded-lg shadow-lg p-6 mb-6`}>
        <div 
          className="flex items-center justify-between mb-6 cursor-pointer select-none"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-black dark:text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-black dark:text-white" />
            )}
            <Video className="w-6 h-6 text-black dark:text-white" />
            <h2 className="text-xl font-bold text-black dark:text-black">
              Panopto Recording Checks
            </h2>
          </div>
          <a
            href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${themeColors.buttonText} ${themeColors.buttonBg} rounded-lg transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
            Go to Panopto
          </a>
        </div>
        {!isCollapsed && (
        
        <div className="space-y-6">
          {/* Skeleton Timeline */}
          <div className="relative">
            {/* Skeleton Timeline line */}
            <div className={`absolute top-2 left-8 right-8 h-0.5 ${themeColors.cardBg}`}></div>
            
            {/* Skeleton Timeline items - Always show 4 skeleton checks */}
            <div className="flex items-start gap-4 justify-between">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col items-center relative flex-shrink-0">
                  {/* Skeleton Timeline dot */}
                  <div className={`w-4 h-4 rounded-full border-2 ${themeColors.cardBg} ${themeColors.badgeBg} animate-pulse`}></div>
                  
                  {/* Skeleton Check details card */}
                  <div className={`mt-4 p-3 rounded-lg border text-center w-32 sm:w-36 ${themeColors.itemBg} animate-pulse`}>
                    <div className={`h-4 ${themeColors.cardBg} rounded mb-2`}></div>
                    <div className={`h-3 ${themeColors.cardBg} rounded mb-3`}></div>
                    <div className={`h-6 ${themeColors.cardBg} rounded mb-2`}></div>
                    <div className={`h-6 ${themeColors.cardBg} rounded`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        )}
      </div>
    );
  }

  // Show "no checks" message only after loading is complete and there are no checks
  if (panoptoTimeline.length === 0) {
    return (
      <div className={`${themeColors.mainBg} rounded-lg shadow-lg p-6 mb-6`}>
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer select-none"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-black dark:text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-black dark:text-white" />
            )}
            <Video className="w-6 h-6 text-black dark:text-white" />
            <h2 className="text-xl font-bold text-black dark:text-black">
              Panopto Recording Checks
            </h2>
          </div>
          <a
            href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${themeColors.buttonText} ${themeColors.buttonBg} rounded-lg transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
            Go to Panopto
          </a>
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2 text-black dark:text-white">
            <Clock className="w-4 h-4" />
            <span>No Panopto checks scheduled for this event duration</span>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`${themeColors.mainBg} rounded-lg shadow-lg p-6 mb-6`}>
      <div 
        className="flex items-center justify-between mb-6 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-black dark:text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black dark:text-white" />
          )}
          {allChecksComplete && !isLoading ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <Video className="w-6 h-6 text-black dark:text-white" />
          )}
          <h2 className="text-xl font-bold text-black dark:text-black">
            Panopto Recording Checks
          </h2>
        </div>
        <a
          href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${themeColors.buttonText} ${themeColors.buttonBg} rounded-lg transition-colors`}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-4 h-4" />
          Go to Panopto
        </a>
      </div>
      {!isCollapsed && (
      
      <>
          {/* Horizontal Timeline */}
          <div className="relative overflow-x-auto">
            {/* Timeline line */}
            <div className={`absolute top-2 left-8 right-8 h-0.5 ${themeColors.cardBg}`}></div>
            
            {/* Timeline items */}
            <div className={`flex items-start gap-4 ${panoptoTimeline.length > 4 ? 'min-w-max px-4' : 'justify-between'}`}>
              {panoptoTimeline.map((check, index) => (
                <div key={check.checkNumber} className="flex flex-col items-center relative flex-shrink-0">
                  {/* Timeline dot */}
                  <div className={`w-4 h-4 rounded-full border-2 z-10 relative ${
                    check.status === 'completed' 
                      ? 'bg-green-600 border-green-600' 
                      : check.status === 'current'
                      ? 'bg-orange-600 border-orange-600'
                      : check.status === 'overdue'
                      ? 'bg-red-600 border-red-600'
                      : `${themeColors.badgeBg} ${themeColors.badgeBg}`
                  }`}>
                    {check.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-white absolute -top-0.5 -left-0.5" />
                    )}
                  </div>
                  
                  {/* Check details card */}
                  <div className={`mt-4 p-3 rounded-lg border text-center w-32 sm:w-36 transition-colors ${getStatusColor(check.status)}`}>
                    <div className="font-semibold text-xs sm:text-sm mb-1">
                      Check #{check.checkNumber}
                    </div>
                    <div className="text-xs font-medium mb-2">
                      {formatTime(check.scheduledTime)}
                    </div>
                    
                    {check.status === 'current' && (
                      <div className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full mb-2">
                        DUE NOW
                      </div>
                    )}
                    {check.status === 'overdue' && (
                      <div className="text-xs bg-red-600 text-white px-2 py-1 rounded-full mb-2">
                        OVERDUE
                      </div>
                    )}
                    
                    <div className="text-xs opacity-75 mb-3 leading-tight">
                      {check.status === 'upcoming' && (
                        <>In {formatTimeDistance(check.scheduledTime).replace(' ago', '').replace('in ', '')}</>
                      )}
                      {check.status === 'current' && (
                        <>Due by {formatTime(check.dueTime)}</>
                      )}
                      {check.status === 'overdue' && (
                        <>Late by {formatTimeDistance(check.dueTime).replace(' ago', '')}</>
                      )}
                      {check.status === 'completed' && (
                        <>✓ Completed</>
                      )}
                    </div>
                    
                    {check.canComplete && check.status !== 'completed' && (
                      <button
                        onClick={() => handleCompleteCheck(check.checkNumber)}
                        className={`w-full px-2 py-1 text-xs font-medium rounded transition-colors ${
                          check.status === 'current'
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        Complete
                      </button>
                    )}
                    {check.status === 'completed' && (
                      <div className="text-xs font-medium text-green-600 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Done
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
