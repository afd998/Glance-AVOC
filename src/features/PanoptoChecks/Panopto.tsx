import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Database } from '../../types/supabase';
import { usePanoptoChecksData } from '../../hooks/usePanoptoChecks';
import { useCompletePanoptoCheckForEvent } from './hooks/useCompletePanoptoCheck';
import { formatDistanceToNow, format } from 'date-fns';
import { Video, Clock, CheckCircle, Circle, AlertCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
  const { data: panoptoChecksData = [], isLoading } = usePanoptoChecksData(event.id);
  const { completeCheck, mutateAsync: completeCheckAsync } = useCompletePanoptoCheckForEvent(event.id);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Drag functionality
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
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
  }, [event, isLoading, panoptoChecksData]);
  
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
        return <Circle className="w-5 h-5 " />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300';
      case 'current':
        return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300';
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300';
      case 'missed':
        return 'bg-gray-200 border-gray-400 text-gray-700 dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-300';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-300';
    }
  };
  
  const handleCompleteCheck = async (checkNumber: number) => {
    if (!event.date) {
      console.error('Event date is required for completing check');
      return;
    }

    // Use optimistic update - the UI will update immediately
    completeCheckAsync({ checkNumber });
  };

  // Drag handlers - only enable dragging on background/empty spaces
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    // Check if the click target is a check card or its children
    const target = e.target as HTMLElement;
    const isCheckCard = target.closest('.check-card') || target.closest('.timeline-dot');
    
    // Only enable dragging if clicking on background/empty space
    if (isCheckCard) {
      return; // Don't start dragging if clicking on a check card
    }
    
    setIsDragging(true);
    setStartX(e.pageX - timelineRef.current.offsetLeft);
    setScrollLeft(timelineRef.current.scrollLeft);
    timelineRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (timelineRef.current) {
      timelineRef.current.style.cursor = 'default';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Cursor will be updated by handleMouseOver when mouse moves
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    // Only update horizontal scroll position
    timelineRef.current.scrollLeft = scrollLeft - walk;
  };

  // Handle cursor changes based on hover target
  const handleMouseOver = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const target = e.target as HTMLElement;
    const isCheckCard = target.closest('.check-card') || target.closest('.timeline-dot');
    
    if (isCheckCard) {
      timelineRef.current.style.cursor = 'default';
    } else {
      timelineRef.current.style.cursor = 'grab';
    }
  };
  
  // Show loading state first
  if (isLoading) {
    return (
      <div className=" bg-background  text-foreground rounded-xl shadow-2xl border   p-6 mb-6" >
        <div
          className="flex items-center justify-between mb-6 cursor-pointer select-none"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 " />
            ) : (
              <ChevronDown className="w-5 h-5 " />
            )}
            <Video className="w-6 h-6 " />
            <Circle className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
            <h2 className="text-xl font-bold  dark:" style={{ fontFamily: "'Olympus Mount', sans-serif" }}>
              PANOPTO RECORDING CHECKS
            </h2>
          </div>
          <Button asChild variant="ghost"  onClick={(e) => e.stopPropagation()}>
            <a
              href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Panopto
            </a>
          </Button>
        </div>
        {!isCollapsed && (
        
        <div className="space-y-6">
          {/* Skeleton Timeline */}
          <div className="relative">
            {/* Skeleton Timeline line - extends full width of all skeleton items */}
            <div 
              className={`absolute top-2 h-0.5 `}
              style={{
                left: '32px', // 8 * 4px = 32px (left-8)
                right: '32px', // 8 * 4px = 32px (right-8)
                width: 'auto' // For skeleton, we always show 4 items so use auto
              }}
            ></div>
            
            {/* Skeleton Timeline items - Always show 4 skeleton checks */}
            <div className="flex items-start gap-4 justify-between">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col items-center relative shrink-0">
                  {/* Skeleton Timeline dot */}
                  <div className={`w-4 h-4 rounded-full border-2 ${themeColors[3]} ${themeColors[7]} animate-pulse`}></div>
                  
                  {/* Skeleton Check details card */}
                  <div className="mt-4 p-3 rounded-lg border border-white/10 dark:border-white/5 text-center w-40 animate-pulse" style={{ background: `${themeHexColors[1]}` }}>
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
      <div className="rounded-xl shadow-2xl border   p-6 mb-6"  >
        <div
          className="flex items-center justify-between mb-4 cursor-pointer select-none"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 " />
            ) : (
              <ChevronDown className="w-5 h-5 " />
            )}
            <Video className="w-6 h-6 " />
            <Circle className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
            <h2 className="text-xl font-bold  dark:" style={{ fontFamily: "'Olympus Mount', sans-serif" }}>
              PANOPTO RECORDING CHECKS
            </h2>
          </div>
          <Button asChild variant="ghost" className="px-3 py-2 text-sm font-medium rounded-lg hover:opacity-80" style={{ background: `linear-gradient(135deg, ${themeHexColors[8]}, ${themeHexColors[9]})` }} onClick={(e) => e.stopPropagation()}>
            <a
              href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Panopto
            </a>
          </Button>
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2 ">
            <Clock className="w-4 h-4" />
            <span>No Panopto checks scheduled for this event duration</span>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className=" bg-background  text-foreground rounded-xl shadow-2xl border   p-6 mb-6" >
      <div 
        className="flex items-center justify-between mb-6 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 " />
          ) : (
            <ChevronDown className="w-5 h-5 " />
          )}
          {allChecksComplete && !isLoading ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <Video className="w-6 h-6 " />
          )}
          {allChecksComplete && !isLoading ? null : (
            <Circle className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
          )}
          <h2 className="text-xl font-bold  " style={{ fontFamily: "'Olympus Mount', sans-serif" }}>
            PANOPTO RECORDING CHECKS
          </h2>
        </div>
        <Button asChild variant="default"  onClick={(e) => e.stopPropagation()}>
          <a
            href="https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Sessions/List.aspx#status=%5B2%2C5%5D"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4" />
            Go to Panopto
          </a>
        </Button>
      </div>
      {!isCollapsed && (
      
      <>
          {/* Horizontal Timeline */}
          <div 
            ref={timelineRef}
            className="relative overflow-x-auto select-none"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseOver={handleMouseOver}
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
          >
            {/* Timeline line - extends full width of all timeline items */}
            <div 
              className={`absolute top-2 h-0.5 ${themeColors[3]}`}
              style={{
                left: '32px', // 8 * 4px = 32px (left-8)
                right: panoptoTimeline.length > 4 ? 'auto' : '32px', // 8 * 4px = 32px (right-8)
                width: panoptoTimeline.length > 4 ? `${panoptoTimeline.length * 176}px` : 'auto' // Calculate based on fixed card width (160px) + gap (16px)
              }}
            ></div>
            
            {/* Timeline items */}
            <div className={`flex items-start gap-4 ${panoptoTimeline.length > 4 ? 'min-w-max px-4' : 'justify-between'}`}>
              {panoptoTimeline.map((check, index) => (
                <div key={check.checkNumber} className="flex flex-col items-center relative shrink-0">
                  {/* Timeline dot */}
                  <div className={`timeline-dot w-4 h-4 rounded-full border-2 z-10 relative ${
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
                      <CheckCircle className="w-4 h-4 absolute -top-0.5 -left-0.5" />
                    )}
                    {check.status === 'missed' && (
                      <svg className="w-4 h-4  absolute -top-0.5 -left-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Check details card */}
                  <Card className={`check-card mt-4 w-40 text-center bg-background ${getStatusColor(check.status)}`}>
                    <CardHeader className=" flex flex-col items-center p-3 pb-1">
                      <div className="font-semibold text-xs  text-foreground sm:text-sm">Check #{check.checkNumber}</div>
                      <div className="text-xs font-medium text-foreground">{formatTime(check.scheduledTime)}</div>
                      {(() => {
                        const label =
                          check.status === 'current' ? 'DUE' :
                          check.status === 'overdue' ? 'OVERDUE' :
                          check.status === 'missed' ? 'MISSED' :
                          check.status === 'completed' ? 'COMPLETED' :
                          null;
                        return label ? (
                          <Badge
                            variant={
                              check.status === 'missed'
                                ? 'disabled'
                                : check.status === 'completed'
                                ? 'affirmative'
                                : 'destructive'
                            }
                            className="text-xs"
                          >
                            {label}
                          </Badge>
                        ) : null;
                      })()}
                    </CardHeader>
                    <CardContent className="px-3 pt-0 pb-3">
                      <div className="text-xs  opacity-75 mb-3 leading-tight">
                        {check.status === 'upcoming' && (
                          <>In {formatTimeDistance(check.scheduledTime).replace(' ago', '').replace('in ', '')}</>
                        )}
                        {check.status === 'current' && <div className="text-red-600">Due now</div>}
                        {check.status === 'overdue' && (
                          <>Late by {formatTimeDistance(check.dueTime).replace(' ago', '')}</>
                        )}
                        {check.status === 'missed' && <>Check was missed</>}
                        {check.status !== 'completed' &&
                          check.status !== 'missed' &&
                          check.status !== 'upcoming' &&
                          check.status !== 'current' &&
                          check.status !== 'overdue' && (
                            <>Scheduled for {formatTime(check.scheduledTime)}</>
                          )}
                        {check.status === 'completed' && (
                          <>
                           
                            {(() => {
                              const eventStart = new Date(`${event.date}T${event.start_time}`);
                              const checkData = panoptoChecksData.find(c => {
                                const checkTime = new Date(`${event.date}T${c.check_time}`);
                                const scheduledTime = new Date(
                                  eventStart.getTime() + (check.checkNumber - 1) * PANOPTO_CHECK_INTERVAL
                                );
                                return Math.abs(checkTime.getTime() - scheduledTime.getTime()) < 60000;
                              });

                              if (checkData?.completed_time) {
                                const userName =
                                  checkData.profiles?.name ||
                                  (checkData.completed_by_user_id
                                    ? `User ${checkData.completed_by_user_id.slice(0, 8)}...`
                                    : 'Unknown User');

                                const latency = calculateCheckLatency(
                                  checkData.check_time,
                                  checkData.completed_time,
                                  event.date!
                                );

                                return (
                                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                                    <div>by {userName}</div>
                                    <div>at {formatCompletionTime(checkData.completed_time)}</div>
                                    <div
                                      className={`mt-1 font-medium flex items-center justify-center gap-1 ${
                                        latency.isLate
                                          ? 'text-red-600 dark:text-red-400'
                                          : 'text-green-600 dark:text-green-400'
                                      }`}
                                    >
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
                    </CardContent>
                    {check.canComplete && check.status !== 'completed' && check.status !== 'missed' && (
                      <CardFooter >
                        <Button
                          size="sm"
                          variant={
                            check.status === 'current' || check.status === 'overdue'
                              ? 'destructive'
                              : 'default'
                          }
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteCheck(check.checkNumber);
                          }}
                        >
                          Complete
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
