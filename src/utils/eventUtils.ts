import React from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

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
  const isStudentEvent = eventName.toLowerCase().includes('student');
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
 * Generate theme colors based on event type
 */
export const getEventThemeColors = (event: Event) => {
  const eventType = event.event_type || '';
  const eventName = event.event_name || '';
  
  const isLecture = eventType === 'Lecture';
  const isStudentEvent = eventName.toLowerCase().includes('student');
  const isFacStaffEvent = !isStudentEvent;
  
  // Define theme colors based on event type
  if (eventType === 'KEC') {
    return {
      mainBg: 'bg-slate-600 border-slate-700',
      mainBgDark: 'bg-slate-800 border-slate-900',
      cardBg: 'bg-slate-500 border-slate-700',
      itemBg: 'bg-slate-500 border-slate-700 hover:bg-slate-600',
      badgeBg: 'bg-slate-700',
      badgeText: 'text-slate-100',
      iconBg: 'bg-slate-700',
      iconText: 'text-slate-200',
      buttonBg: 'bg-slate-700 hover:bg-slate-800',
      buttonText: 'text-slate-100'
    };
  } else if (eventType === 'CMC') {
    return {
      mainBg: 'bg-red-700 border-red-800',
      mainBgDark: 'bg-red-900 border-red-950',
      cardBg: 'bg-red-600 border-red-800',
      itemBg: 'bg-red-600 border-red-800 hover:bg-red-700',
      badgeBg: 'bg-red-800',
      badgeText: 'text-red-100',
      iconBg: 'bg-red-800',
      iconText: 'text-red-200',
      buttonBg: 'bg-red-800 hover:bg-red-900',
      buttonText: 'text-red-100'
    };
  } else if (isLecture) {
    return {
      mainBg: 'bg-[#7C6CA1] border-[#8D7DAD]',
      mainBgDark: 'bg-[#605283] border-[#4A3E60]',
      cardBg: 'bg-[#AFAFC5] border-[#8D7DAD]',
      itemBg: 'bg-[#AFAFC5] border-[#8D7DAD] hover:bg-[#9E8EB9]',
      badgeBg: 'bg-[#605283]',
      badgeText: 'text-[#4A3E60]',
      iconBg: 'bg-[#605283]',
      iconText: 'text-[#4A3E60]',
      buttonBg: 'bg-[#605283] hover:bg-[#4A3E60]',
      buttonText: 'text-[#4A3E60]'
    };
  } else if (isStudentEvent) {
    return {
      mainBg: 'bg-amber-700 border-amber-800',
      mainBgDark: 'bg-amber-900 border-amber-950',
      cardBg: 'bg-amber-600 border-amber-800',
      itemBg: 'bg-amber-600 border-amber-800 hover:bg-amber-700',
      badgeBg: 'bg-amber-800',
      badgeText: 'text-amber-100',
      iconBg: 'bg-amber-800',
      iconText: 'text-amber-200',
      buttonBg: 'bg-amber-800 hover:bg-amber-900',
      buttonText: 'text-amber-100'
    };
  } else if (isFacStaffEvent) {
    return {
      mainBg: 'bg-slate-700 border-slate-800',
      mainBgDark: 'bg-slate-900 border-slate-950',
      cardBg: 'bg-slate-600 border-slate-800',
      itemBg: 'bg-slate-600 border-slate-800 hover:bg-slate-700',
      badgeBg: 'bg-slate-800',
      badgeText: 'text-slate-100',
      iconBg: 'bg-slate-800',
      iconText: 'text-slate-200',
      buttonBg: 'bg-slate-800 hover:bg-slate-900',
      buttonText: 'text-slate-100'
    };
  } else {
    // Default gray theme
    return {
      mainBg: 'bg-slate-600 border-slate-700',
      mainBgDark: 'bg-slate-800 border-slate-900',
      cardBg: 'bg-slate-500 border-slate-700',
      itemBg: 'bg-slate-500 border-slate-700 hover:bg-slate-600',
      badgeBg: 'bg-slate-700',
      badgeText: 'text-slate-100',
      iconBg: 'bg-slate-700',
      iconText: 'text-slate-200',
      buttonBg: 'bg-slate-700 hover:bg-slate-800',
      buttonText: 'text-slate-100'
    };
  }
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

  // Parse start and end times (now in HH:MM:SS format)
  const [startHour, startMin] = event.start_time.split(':').map(Number);
  const [endHour, endMin] = event.end_time.split(':').map(Number);
  
  const eventStartMinutes = startHour * 60 + startMin;
  const eventEndMinutes = endHour * 60 + endMin;
  const durationMinutes = eventEndMinutes - eventStartMinutes;
  
  // Calculate position relative to timeline start
  const startMinutesRelative = eventStartMinutes - startMinutes;
  const endMinutesRelative = eventEndMinutes - startMinutes;
  
  // Ensure minimum width for very short events
  const calculatedWidth = Math.max(durationMinutes * pixelsPerMinute - eventMargin * 2, 30); // Minimum 30px width
  
  return {
    startMinutes: startMinutesRelative,
    endMinutes: endMinutesRelative,
    durationMinutes,
    left: `${(startMinutesRelative * pixelsPerMinute + eventMargin) - roomLabelWidth}px`,
    width: `${calculatedWidth}px`
  };
}; 

type ShiftBlock = Database['public']['Tables']['shift_blocks']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

// Updated to use date instead of week_start
export async function getAllShiftBlocksForDate(date: string) {
  const { data, error } = await supabase
    .from('shift_blocks')
    .select('*')
    .eq('date', date);

  if (error) throw error;
  return data || [];
}

// Updated to use date instead of day_of_week
export function sortShiftsByTime(shifts: Shift[]): Shift[] {
  // Sort by date and then by start_time to ensure consistent chronological order
  return shifts.sort((a, b) => {
    // First sort by date
    if (a.date !== b.date) {
      return (a.date ?? '').localeCompare(b.date ?? '');
    }
    
    // Then sort by start_time
    if (!a.start_time || !b.start_time) return 0;
    return a.start_time.localeCompare(b.start_time);
  });
} 