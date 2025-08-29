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
  contentBgColor: string;
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
  let contentBgColor = "bg-gray-500"; // Slightly darker version for content sections
  
  if (eventType === 'KEC') {
    bgColor = "bg-gray-400"; // KEC events get medium gray background
    contentBgColor = "bg-[#8a91a0]"; // Custom slightly darker version of #9da4b0
  } else if (eventType === 'CMC') {
    bgColor = "bg-red-300"; // CMC events get pastel red background
    contentBgColor = "bg-red-400"; // Slightly darker red for content
  } else if (eventType === 'KSM: Kellogg FacStaff (KGH)') {
    bgColor = "bg-[#9b8ba5]"; // KSM purple
    contentBgColor = "bg-[#8f7f99]"; // Slightly darker purple for content
  } else if (isLecture) {
    bgColor = "noise-bg"; // Check lectures FIRST - Keep lecture events with the purple noise background
    contentBgColor = "bg-[#5a4a7a]"; // Slightly darker purple for content
  } else if (isStudentEvent) {
    bgColor = "bg-[#b8a68a]";
    contentBgColor = "bg-[#ad9b80]"; // Slightly darker beige for content
  } else if (isFacStaffEvent) {
    bgColor = "bg-[#9b8ba5]";
    contentBgColor = "bg-[#8f7f99]"; // Slightly darker purple for content
  }
  
  return {
    isStudentEvent,
    isFacStaffEvent,
    isLecture,
    bgColor,
    contentBgColor
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
      mainBg: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      mainBgDark: 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600',
      cardBg: 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
      itemBg: 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600',
      badgeBg: 'bg-gray-200 dark:bg-gray-600',
      badgeText: 'text-gray-800 dark:text-gray-200',
      iconBg: 'bg-gray-200 dark:bg-gray-600',
      iconText: 'text-gray-700 dark:text-gray-300',
      buttonBg: 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500',
      buttonText: 'text-gray-800 dark:text-gray-200'
    };
  } else if (eventType === 'KSM: Kellogg FacStaff (KGH)') {
    return {
      mainBg: 'bg-[#9b8ba5] border-[#8c7c94]',
      mainBgDark: 'bg-[#7d6d83] border-[#6e5f72]',
      cardBg: 'bg-[#b9abbd] border-[#8c7c94]',
      itemBg: 'bg-[#b9abbd] border-[#8c7c94] hover:bg-[#aa9bb1]',
      badgeBg: 'bg-[#7d6d83]',
      badgeText: 'text-[#504250]',
      iconBg: 'bg-[#7d6d83]',
      iconText: 'text-[#504250]',
      buttonBg: 'bg-[#7d6d83] hover:bg-[#6e5f72]',
      buttonText: 'text-[#504250]'
    };
  } else if (eventType === 'CMC') {
    return {
      mainBg: 'bg-red-300 border-red-400',
      mainBgDark: 'bg-red-400 border-red-500',
      cardBg: 'bg-red-200 border-red-400',
      itemBg: 'bg-red-200 border-red-400 hover:bg-red-300',
      badgeBg: 'bg-red-500',
      badgeText: 'text-red-900',
      iconBg: 'bg-red-500',
      iconText: 'text-red-900',
      buttonBg: 'bg-red-500 hover:bg-red-600',
      buttonText: 'text-red-900'
    };
  } else if (isLecture) {
    return {
      mainBg: 'bg-[#7C6CA1] border-[#8D7DAD]',
      mainBgDark: 'bg-[#605283] border-[#4A3E60]',
      cardBg: 'bg-[#605283] border-[#8D7DAD]',
      itemBg: 'bg-[#605283] border-[#8D7DAD] hover:bg-[#9E8EB9]',
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

// Check if a user is an owner of an event
export function isUserEventOwner(
  event: any,
  userId: string,
  shiftBlocks: any[] = []
): boolean {
  // Check if user is the manual owner
  if (event.man_owner === userId) {
    return true;
  }

  // For KEC events, there are no calculated owners, so only check manual ownership
  if (event.event_type === "KEC") {
    return false;
  }

  // Check if user is a calculated owner from shift blocks
  if (!event.date || !event.start_time || !event.end_time || !event.room_name) {
    return false;
  }

  const eventDate = event.date;
  const eventStartTime = event.start_time;
  const eventEndTime = event.end_time;
  const eventRoom = event.room_name;

  // Find shift blocks that overlap with the event
  const relevantBlocks = shiftBlocks.filter((block: any) => {
    if (!block.date || !block.start_time || !block.end_time) return false;
    
    // Check if block is for the same date
    if (block.date !== eventDate) return false;
    
    // Check if block overlaps with event time
    const blockStart = block.start_time;
    const blockEnd = block.end_time;
    
    // Event overlaps with block
    const overlaps = (eventStartTime >= blockStart && eventStartTime < blockEnd) ||
           (eventEndTime > blockStart && eventEndTime <= blockEnd) ||
           (eventStartTime <= blockStart && eventEndTime >= blockEnd);
    
    return overlaps;
  });

  // Check if user is assigned to the event's room in any of the relevant blocks
  for (const block of relevantBlocks) {
    if (!block.assignments) continue;
    
    if (Array.isArray(block.assignments)) {
      for (const assignment of block.assignments) {
        if (assignment && assignment.rooms && Array.isArray(assignment.rooms)) {
          if (assignment.rooms.includes(eventRoom) && assignment.user === userId) {
            return true;
          }
        }
      }
    }
  }

  return false;
} 