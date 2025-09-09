import React, { useMemo, useState, useEffect } from 'react';
import { Database } from '../../types/supabase';
import { usePanoptoChecks } from '../../hooks/usePanoptoChecks';
import { usePanoptoChecksData } from '../../hooks/usePanoptoChecksData';
import { useOverduePanoptoChecks } from '../../hooks/useOverduePanoptoChecks';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { Video, Clock, CheckCircle, Circle, AlertCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { getEventThemeColors, getEventThemeHexColors } from '../../utils/eventUtils';

type Event = Database['public']['Tables']['events']['Row'];

interface PanoptoProps {
  event: Event;
}

interface PanoptoCheckTimeline {
  checkNumber: number;
  scheduledTime: Date;
  dueTime: Date;
  status: 'completed' | 'missed' | 'current' | 'upcoming' | 'overdue';
  canComplete: boolean;
}

const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function Panopto({ event }: PanoptoProps) {
  const { activeChecks, completePanoptoCheck, completePanoptoCheckForEvent } = usePanoptoChecks();
  const { data: panoptoChecksData = [], isLoading } = usePanoptoChecksData(event.id);
  const { invalidatePanoptoChecks } = useOverduePanoptoChecks([event]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);
  const themeHexColors = getEventThemeHexColors(event);
  
  // Check if all checks are complete
  const allChecksComplete = useMemo(() => {
    if (isLoading || panoptoChecksData.length === 0) return false;
    
    // Calculate expected number of checks
    let totalChecks = 0;
    if (event.start_time && event.end_time) {
      const eventStart = new Date(`${event.date}T${event.start_time}`);
      const eventEnd = new Date(`${event.date}T${event.end_time}`);
      const eventDuration = eventEnd.getTime() - eventStart.getTime();
      totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);
    }
    
    if (totalChecks === 0) return true; // No checks needed
    
    // Check if all checks are complete using React Query data
    const completedCount = panoptoChecksData.filter(check => check.completed_time !== null).length;
    return completedCount >= totalChecks;
  }, [panoptoChecksData, event.start_time, event.end_time, event.date, isLoading]);
  
  // Convert panoptoChecksData to boolean array for backward compatibility
  const completedChecks = useMemo(() => {
    return panoptoChecksData.map(check => check.completed_time !== null);
  }, [panoptoChecksData]);
  
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
    if (!event.date || !event.start_time || !event.end_time || isLoading) {
      console.log('Panopto timeline calculation skipped:', {
        hasDate: !!event.date,
        hasStartTime: !!event.start_time,
        hasEndTime: !!event.end_time,
        isLoading
      });
      return [];
    }
    
    const eventStart = new Date(`${event.date}T${event.start_time}`);
    const eventEnd = new Date(`${event.date}T${event.end_time}`);
    const eventDuration = eventEnd.getTime() - eventStart.getTime();
    const totalChecks = Math.floor(eventDuration / PANOPTO_CHECK_INTERVAL);
    
    if (totalChecks === 0) {
      console.log('No checks needed for event duration:', eventDuration);
      return [];
    }
    
    const now = new Date();

    
    const checks: PanoptoCheckTimeline[] = [];
    
    for (let i = 0; i < totalChecks; i++) {
      const checkNumber = i + 1;
      const scheduledTime = new Date(eventStart.getTime() + (i * PANOPTO_CHECK_INTERVAL));
      
      let status: 'completed' | 'missed' | 'current' | 'upcoming' | 'overdue' = 'upcoming';
      let canComplete = false;
      
      // Check the database status - this takes priority over everything
      const checkData = panoptoChecksData.find(c => {
        const checkTime = new Date(`${event.date}T${c.check_time}`);
        const scheduledTime = new Date(eventStart.getTime() + ((checkNumber - 1) * PANOPTO_CHECK_INTERVAL));
        return Math.abs(checkTime.getTime() - scheduledTime.getTime()) < 60000; // Within 1 minute
      });
      
      // Debug logging for first few checks
      if (checkNumber <= 3) {
        console.log(`Check ${checkNumber} database data:`, {
          checkNumber,
          checkData,
          databaseStatus: checkData?.status,
          completedTime: checkData?.completed_time
        });
      }
      
      if (checkData?.status === 'missed') {
        // Database says it's missed - show as missed regardless of time
        status = 'missed';
        canComplete = false;
      } else if (checkData?.completed_time) {
        // Database says it's completed
        status = 'completed';
        canComplete = false;
      } else {
        // Calculate time-based status for checks that aren't completed or missed
        const timeSinceScheduled = now.getTime() - scheduledTime.getTime();
        const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (timeSinceScheduled >= thirtyMinutes) {
          status = 'missed';
          canComplete = false;
        } else if (timeSinceScheduled >= tenMinutes) {
          status = 'overdue';
          canComplete = true;
        } else if (timeSinceScheduled >= 0) {
          status = 'current'; // This will be displayed as "due"
          canComplete = true;
        } else {
          status = 'upcoming';
          canComplete = false;
        }
      }
      
      checks.push({
        checkNumber,
        scheduledTime,
        dueTime: scheduledTime, // Use scheduledTime as dueTime for consistency
        status,
        canComplete
      });
    }
    
    return checks;
  }, [event, activeChecks, completedChecks, isLoading, panoptoChecksData]);
  
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const formatCompletionTime = (timeString: string) => {
    // timeString is in HH:MM:SS format, convert to readable time
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const calculateCheckLatency = (checkTime: string, completedTime: string, eventDate: string) => {
    // Parse the times and calculate how late the check was completed
    const checkDateTime = new Date(`${eventDate}T${checkTime}`);
    const completedDateTime = new Date(`${eventDate}T${completedTime}`);
    
    // Calculate difference in minutes
    const diffMs = completedDateTime.getTime() - checkDateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    // 10 minutes grace period
    const gracePeriod = 10;
    const actualLatency = diffMinutes - gracePeriod;
    
    if (actualLatency <= 0) {
      return { isLate: false, minutesLate: 0, message: 'On time' };
    } else {
      // Convert to hours and minutes
      const hours = Math.floor(actualLatency / 60);
      const minutes = actualLatency % 60;
      
      let message = '';
      if (hours > 0) {
        message = `${hours}h ${minutes}m late`;
      } else {
        message = `${minutes}m late`;
      }
      
      return { 
        isLate: true, 
        minutesLate: actualLatency, 
        message: message
      };
    }
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
      case 'missed':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Circle className="w-5 h-5 text-black dark:text-white" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'current':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'missed':
        return 'bg-gray-200 border-gray-400 text-gray-700';
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
      // Invalidate React Query cache to trigger immediate refetch
      invalidatePanoptoChecks(event.id);
    }
  };
  
  // Show loading state first
  if (isLoading) {
    return (
      <div className="rounded-xl shadow-2xl border border-white/20 dark:border-white/10 p-6 mb-6" style={{ background: `${themeHexColors[7]}` }}>
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
            <Circle className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
            <h2 className="text-xl font-bold text-black dark:text-black" style={{ fontFamily: "'Olympus Mount', sans-serif" }}>
              PANOPTO RECORDING CHECKS
            </h2>
          </div>
          <a
            href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-80`}
            style={{ background: `linear-gradient(135deg, ${themeHexColors[8]}, ${themeHexColors[9]})` }}
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
            <div className={`absolute top-2 left-8 right-8 h-0.5 ${themeColors[3]}`}></div>
            
            {/* Skeleton Timeline items - Always show 4 skeleton checks */}
            <div className="flex items-start gap-4 justify-between">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col items-center relative flex-shrink-0">
                  {/* Skeleton Timeline dot */}
                  <div className={`w-4 h-4 rounded-full border-2 ${themeColors[3]} ${themeColors[7]} animate-pulse`}></div>
                  
                  {/* Skeleton Check details card */}
                  <div className="mt-4 p-3 rounded-lg border border-white/10 dark:border-white/5 text-center w-32 sm:w-36 animate-pulse" style={{ background: `${themeHexColors[1]}` }}>
                    <div className={`h-4 ${themeColors[3]} rounded mb-2`}></div>
                    <div className={`h-3 ${themeColors[3]} rounded mb-3`}></div>
                    <div className={`h-6 ${themeColors[3]} rounded mb-2`}></div>
                    <div className={`h-6 ${themeColors[3]} rounded`}></div>
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
      <div className="rounded-xl shadow-2xl border border-white/20 dark:border-white/10 p-6 mb-6" style={{ background: `${themeHexColors[7]}` }}>
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
            <Circle className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
            <h2 className="text-xl font-bold text-black dark:text-black" style={{ fontFamily: "'Olympus Mount', sans-serif" }}>
              PANOPTO RECORDING CHECKS
            </h2>
          </div>
          <a
            href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-80`}
            style={{ background: `linear-gradient(135deg, ${themeHexColors[8]}, ${themeHexColors[9]})` }}
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
    <div className="rounded-xl shadow-2xl border border-white/20 dark:border-white/10 p-6 mb-6" style={{ background: `${themeHexColors[7]}` }}>
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
          {allChecksComplete && !isLoading ? null : (
            <Circle className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
          )}
          <h2 className="text-xl font-bold text-black dark:text-black" style={{ fontFamily: "'Olympus Mount', sans-serif" }}>
            PANOPTO RECORDING CHECKS
          </h2>
        </div>
        <a
          href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${themeColors.text1} ${themeColors[8]} rounded-lg transition-colors`}
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
            <div className={`absolute top-2 left-8 right-8 h-0.5 ${themeColors[3]}`}></div>
            
            {/* Timeline items */}
            <div className={`flex items-start gap-4 ${panoptoTimeline.length > 4 ? 'min-w-max px-4' : 'justify-between'}`}>
              {panoptoTimeline.map((check, index) => (
                <div key={check.checkNumber} className="flex flex-col items-center relative flex-shrink-0">
                  {/* Timeline dot */}
                  <div className={`w-4 h-4 rounded-full border-2 z-10 relative ${
                    check.status === 'completed' 
                      ? 'bg-green-600 border-green-600' 
                      : check.status === 'current'
                      ? 'bg-red-600 border-red-600'
                      : check.status === 'overdue'
                      ? 'bg-red-600 border-red-600'
                      : check.status === 'missed'
                      ? 'bg-gray-500 border-gray-500'
                      : `${themeColors[7]} ${themeColors[7]}`
                  }`}>
                    {check.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-white absolute -top-0.5 -left-0.5" />
                    )}
                    {check.status === 'missed' && (
                      <svg className="w-4 h-4 text-white absolute -top-0.5 -left-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Check details card */}
                  <div className={`mt-4 p-3 rounded-lg border text-center w-32 sm:w-36 transition-colors backdrop-blur-sm shadow-lg ${getStatusColor(check.status)}`}>
                    <div className="font-semibold text-xs sm:text-sm mb-1">
                      Check #{check.checkNumber}
                    </div>
                    <div className="text-xs font-medium mb-2">
                      {formatTime(check.scheduledTime)}
                    </div>
                    
                    {check.status === 'current' && (
                      <div className="text-xs bg-red-600 text-white px-2 py-1 rounded-full mb-2">
                        DUE
                      </div>
                    )}
                    {check.status === 'overdue' && (
                      <div className="text-xs bg-red-600 text-white px-2 py-1 rounded-full mb-2">
                        OVERDUE
                      </div>
                    )}
                    {check.status === 'missed' && (
                      <div className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full mb-2">
                        MISSED
                      </div>
                    )}
                    
                    <div className="text-xs opacity-75 mb-3 leading-tight">
                      {check.status === 'upcoming' && (
                        <>In {formatTimeDistance(check.scheduledTime).replace(' ago', '').replace('in ', '')}</>
                      )}
                      {check.status === 'current' && (
                        <>Due now</>
                      )}
                      {check.status === 'overdue' && (
                        <>Late by {formatTimeDistance(check.dueTime).replace(' ago', '')}</>
                      )}
                      {check.status === 'missed' && (
                        <>Check was missed</>
                      )}
                      {check.status !== 'completed' && check.status !== 'missed' && check.status !== 'upcoming' && check.status !== 'current' && check.status !== 'overdue' && (
                        <>Scheduled for {formatTime(check.scheduledTime)}</>
                      )}
                                          {check.status === 'completed' && (
                      <>
                        ✓ Completed
                        {/* Show completion details */}
                        {(() => {
                          const eventStart = new Date(`${event.date}T${event.start_time}`);
                          const checkData = panoptoChecksData.find(c => {
                            const checkTime = new Date(`${event.date}T${c.check_time}`);
                            const scheduledTime = new Date(eventStart.getTime() + ((check.checkNumber - 1) * PANOPTO_CHECK_INTERVAL));
                            return Math.abs(checkTime.getTime() - scheduledTime.getTime()) < 60000; // Within 1 minute
                          });
                          
                          if (checkData?.completed_time) {
                            // Debug the check data
                            console.log('Check data for display:', checkData);
                            console.log('Profiles data:', checkData.profiles);
                            
                            const userName = checkData.profiles?.name || (checkData.completed_by_user_id ? `User ${checkData.completed_by_user_id.slice(0, 8)}...` : 'Unknown User');
                            
                            // Calculate how late the check was completed
                            const latency = calculateCheckLatency(
                              checkData.check_time, 
                              checkData.completed_time, 
                              event.date!
                            );
                            
                            return (
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                                <div>by {userName}</div>
                                <div>at {formatCompletionTime(checkData.completed_time)}</div>
                                <div className={`mt-1 font-medium flex items-center justify-center gap-1 ${
                                  latency.isLate ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {latency.isLate ? (
                                    <Clock className="w-3 h-3" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  {latency.message}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                    </div>
                    
                    {check.canComplete && check.status !== 'completed' && check.status !== 'missed' && (
                      <button
                        onClick={() => handleCompleteCheck(check.checkNumber)}
                        className={`w-full px-2 py-1 text-xs font-medium rounded transition-colors ${
                          check.status === 'current'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : check.status === 'overdue'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Complete
                      </button>
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
