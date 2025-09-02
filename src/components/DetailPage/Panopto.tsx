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
  const { activeChecks, completePanoptoCheck, completePanoptoCheckForEvent } = usePanoptoChecks();
  const [completedChecks, setCompletedChecks] = useState<boolean[]>([]);
  const [panoptoChecksData, setPanoptoChecksData] = useState<any[]>([]);
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
  
  // Load panopto checks from the new table structure
  useEffect(() => {
    const loadPanoptoChecks = async () => {
      try {
        // Load checks from panopto_checks table with user details from profiles
        const { data: checksData, error } = await supabase
          .from('panopto_checks')
          .select(`
            check_time, 
            completed_time, 
            completed_by_user_id,
            profiles!panopto_checks_completed_by_user_id_fkey(id, name)
          `)
          .eq('event_id', event.id)
          .order('check_time');

        if (error) {
          console.error('Error loading panopto checks:', error);
          setIsLoading(false);
          return;
        }

        // Store the full check data for display
        setPanoptoChecksData(checksData || []);
        
        // Convert to boolean array format for backward compatibility with existing UI
        const completedChecksArray = checksData?.map(check => check.completed_time !== null) || [];
        setCompletedChecks(completedChecksArray);
        setIsLoading(false);
        
        // Debug logging
        console.log('Panopto checks loaded:', {
          eventId: event.id,
          checksData: checksData,
          completedChecksArray: completedChecksArray,
          isLoading: false
        });
        
        // Debug the first check to see the structure
        if (checksData && checksData.length > 0) {
          console.log('First check data structure:', checksData[0]);
          console.log('Profiles data available:', checksData[0].profiles);
        }
      } catch (error) {
        console.error('Error in loadPanoptoChecks:', error);
        setIsLoading(false);
      }
    };

    loadPanoptoChecks();

    // Refresh every 30 seconds to pick up changes
    const interval = setInterval(loadPanoptoChecks, 30000);
    return () => clearInterval(interval);
  }, [event.id]);
  
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
      const dueTime = new Date(scheduledTime.getTime() + (5 * 60 * 1000)); // 5 minutes to complete
      
      // Check if this check has been completed (from database)
      const isCompleted = completedChecks[checkNumber - 1] === true;
      
      // Debug logging for first few checks
      if (checkNumber <= 3) {
        console.log(`Check ${checkNumber} status:`, {
          checkNumber,
          completedChecksLength: completedChecks.length,
          isCompleted,
          completedChecksIndex: checkNumber - 1,
          completedChecksValue: completedChecks[checkNumber - 1]
        });
      }
      
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
              // Refresh the completion status from the new panopto_checks table
        const { data: checksData, error } = await supabase
          .from('panopto_checks')
          .select(`
            check_time, 
            completed_time, 
            completed_by_user_id,
            profiles!panopto_checks_completed_by_user_id_fkey(id, name)
          `)
          .eq('event_id', event.id)
          .order('check_time');
        
      if (!error && checksData) {
        // Store the full check data for display
        setPanoptoChecksData(checksData);
        
        // Convert to boolean array format for backward compatibility with existing UI
        const completedChecksArray = checksData.map(check => check.completed_time !== null);
        setCompletedChecks(completedChecksArray);
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
