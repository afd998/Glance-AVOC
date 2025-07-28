import React from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface ResourceItem {
  itemName: string;
  [key: string]: any;
}

interface ResourceFlags {
  resources: ResourceItem[];
}

interface EventTypeInfo {
  isStudentEvent: boolean;
  isFacStaffEvent: boolean;
  isLecture: boolean;
  bgColor: string;
}

interface EventPosition {
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  left: string;
  width: string;
}

/**
 * Parse event resources and return both boolean flags and full resource list
 * @param event - The event object with resources stored in event.resources
 * @returns Object containing boolean flags and resource list
 */
export const parseEventResources = (event: Event): ResourceFlags => {
  // Check if event has resources in the new JSONB format
  if (!event.resources || !Array.isArray(event.resources)) {
    return {
      resources: []
    };
  }

  const resources = event.resources as ResourceItem[];

  // Add icon and displayName properties to each resource item
  const resourcesWithIcons = resources.map(item => ({
    ...item,
    icon: getResourceIcon(item.itemName),
    displayName: getResourceDisplayName(item.itemName)
  }));

  return {
    resources: resourcesWithIcons
  };
};

/**
 * Get icon for a resource item
 */
export const getResourceIcon = (itemName: string): string => {
  const name = itemName?.toLowerCase() || '';
  
  if (name.includes('laptop') || name.includes('computer')) return '💻';
  if (name.includes('camera') || name.includes('doc cam')) return '📷';
  if (name.includes('zoom') || name.includes('video')) return '📹';
  if (name.includes('panel') || name.includes('control')) return '🎛️';
  if (name.includes('audio') || name.includes('microphone')) return '🎤';
  if (name.includes('display') || name.includes('monitor')) return '🖥️';
  if (name.includes('ksm-kgh-av-kis notes') || name.includes('notes')) return '📝';
  
  return '📱'; // Default icon
};

/**
 * Get display name for a resource item
 */
export const getResourceDisplayName = (itemName: string): string => {
  // Clean up common patterns
  return itemName
    ?.replace(/^(laptop|computer)\s*-?\s*/i, 'Laptop ')
    ?.replace(/^(camera|doc cam)\s*-?\s*/i, 'Camera ')
    ?.replace(/zoom/i, 'Zoom')
    ?.replace(/^.*staff assistance$/i, 'Staff Assistance')
    ?.replace(/^.*web conference$/i, 'Web Conference')
    ?.replace(/^.*handheld microphone$/i, 'Handheld Microphone')
    ?.replace(/^.*clickers.*polling.*$/i, 'Clickers (Polling)')
    ?.replace(/^ksm-kgh-av-kis notes$/i, 'AV Setup Notes')
    || itemName;
};

/**
 * Determine event type information including colors
 */
export const getEventTypeInfo = (event: Event): EventTypeInfo => {
  const eventType = event.event_type || '';
  const eventName = event.event_name || '';
  
  const isLecture = eventType === 'Lecture';
  
  // Determine if it's a student or faculty/staff event
  const isStudentEvent = isLecture || eventName.toLowerCase().includes('student');
  const isFacStaffEvent = !isStudentEvent;
  
  // Determine background color
  let bgColor = "bg-gray-400"; // Default light gray color for non-lecture events
  if (eventType === 'KEC') bgColor = "bg-transparent border-2 border-gray-400"; // KEC events get transparent background with gray border
  else if (eventType === 'CMC') bgColor = "bg-red-300"; // CMC events get pastel red background
  else if (isLecture) bgColor = "noise-bg"; // Check lectures FIRST - Keep lecture events with the purple noise background
  else if (isStudentEvent) bgColor = "bg-[#b8a68a]";
  else if (isFacStaffEvent) bgColor = "bg-[#9b8ba5]";
  
  return {
    isStudentEvent,
    isFacStaffEvent,
    isLecture,
    bgColor
  };
};

/**
 * Calculate event position on the timeline
 */
export const calculateEventPosition = (
  event: Event,
  startMinutes: number,
  pixelsPerMinute: number,
  roomLabelWidth: number,
  eventMargin: number = 1
): EventPosition => {
  if (!event.start_time || !event.end_time) {
    return {
      startMinutes: 0,
      endMinutes: 0,
      durationMinutes: 0,
      left: '0px',
      width: '0px'
    };
  }

  // Parse start and end times
  const [startHour, startMin] = event.start_time.split(':').map(Number);
  const [endHour, endMin] = event.end_time.split(':').map(Number);
  
  const eventStartMinutes = startHour * 60 + startMin;
  const eventEndMinutes = endHour * 60 + endMin;
  const durationMinutes = eventEndMinutes - eventStartMinutes;
  
  // Calculate position relative to timeline start
  const startMinutesRelative = eventStartMinutes - startMinutes;
  const endMinutesRelative = eventEndMinutes - startMinutes;
  
  // Ensure minimum width for very short events
  const calculatedWidth = Math.max(durationMinutes * pixelsPerMinute - eventMargin * 2, 60); // Minimum 60px width
  
  return {
    startMinutes: startMinutesRelative,
    endMinutes: endMinutesRelative,
    durationMinutes,
    left: `${(startMinutesRelative * pixelsPerMinute + eventMargin) - roomLabelWidth}px`,
    width: `${calculatedWidth}px`
  };
}; 

export async function getAllShiftBlocksForWeek(week_start: string) {
  const { data, error } = await supabase
    .from('shift_blocks')
    .select('*')
    .eq('week_start', week_start);
  if (error) throw error;
  
  // Sort by day_of_week and then by start_time to ensure consistent chronological order
  const sortedData = (data || []).sort((a, b) => {
    // First sort by day of week
    if (a.day_of_week !== b.day_of_week) {
      return (a.day_of_week ?? 0) - (b.day_of_week ?? 0);
    }
    // Then sort by start time within the same day
    if (!a.start_time || !b.start_time) return 0;
    return a.start_time.localeCompare(b.start_time);
  });
  
  return sortedData as Database['public']['Tables']['shift_blocks']['Row'][];
} 