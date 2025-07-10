import React from 'react';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface ResourceItem {
  itemName: string;
  [key: string]: any;
}

interface ResourceFlags {
  hasVideoRecording: boolean;
  hasHandheldMic: boolean;
  hasStaffAssistance: boolean;
  hasWebConference: boolean;
  hasClickers: boolean;
  resources: ResourceItem[];
}

interface EventTypeInfo {
  isStudentEvent: boolean;
  isFacStaffEvent: boolean;
  isClass: boolean;
  isSpecial: boolean;
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
      hasVideoRecording: false,
      hasHandheldMic: false,
      hasStaffAssistance: false,
      hasWebConference: false,
      hasClickers: false,
      resources: []
    };
  }

  const resources = event.resources as ResourceItem[];

  // Compute boolean flags for quick checks
  const hasVideoRecording = resources.some(item => 
    item.itemName === "KSM-KGH-VIDEO-Recording (POST TO CANVAS)" || 
    item.itemName === "KSM-KGH-VIDEO-Recording (PRIVATE LINK)" ||
    item.itemName === "KSM-KGH-VIDEO-Recording"
  );
  
  const hasHandheldMic = resources.some(item => 
    item.itemName === "KSM-KGH-AV-Handheld Microphone"
  );
  
  const hasStaffAssistance = resources.some(item => 
    item.itemName === "KSM-KGH-AV-Staff Assistance"
  );
  
  const hasWebConference = resources.some(item => 
    item.itemName === "KSM-KGH-AV-Web Conference"
  );
  
  const hasClickers = resources.some(item => 
    item.itemName === "KSM-KGH-AV-SRS Clickers (polling)"
  );

  return {
    hasVideoRecording,
    hasHandheldMic,
    hasStaffAssistance,
    hasWebConference,
    hasClickers,
    resources
  };
};

/**
 * Get the icon for a resource item
 * @param itemName - The resource item name
 * @returns Icon emoji string
 */
export const getResourceIcon = (itemName: string): string => {
  switch (itemName) {
    case "KSM-KGH-VIDEO-Recording (POST TO CANVAS)":
    case "KSM-KGH-VIDEO-Recording":
      return "📹";
    case "KSM-KGH-VIDEO-Recording (PRIVATE LINK)":
      return "🔗";
    case "KSM-KGH-AV-Handheld Microphone":
      return "🎤";
    case "KSM-KGH-AV-Staff Assistance":
      return "🚶";
    case "KSM-KGH-AV-Web Conference":
      return "💻";
    case "KSM-KGH-AV-SRS Clickers (polling)":
      return "📱";
    default:
      return "📋";
  }
};

/**
 * Get a human-readable name for a resource
 * @param itemName - The resource item name
 * @returns Human-readable name
 */
export const getResourceDisplayName = (itemName: string): string => {
  switch (itemName) {
    case "KSM-KGH-VIDEO-Recording (POST TO CANVAS)":
      return "Video Recording (Canvas)";
    case "KSM-KGH-VIDEO-Recording (PRIVATE LINK)":
      return "Video Recording (Private)";
    case "KSM-KGH-VIDEO-Recording":
      return "Video Recording";
    case "KSM-KGH-AV-Handheld Microphone":
      return "Handheld Microphone";
    case "KSM-KGH-AV-Staff Assistance":
      return "Staff Assistance";
    case "KSM-KGH-AV-Web Conference":
      return "Web Conference";
    case "KSM-KGH-AV-SRS Clickers (polling)":
      return "Clickers (Polling)";
    default:
      return itemName;
  }
};

/**
 * Parse room name from format "KGH1110 (70)" to "GH 1110" or "KGHL110" to "GH L110"
 * @param roomName - The room name from the database
 * @returns Parsed room name or null if no match
 */
export const parseRoomName = (roomName: string | null): string | null => {
  if (!roomName) {
    return null;
  }
  
  // If the room name is already in the correct format (GH 1110), return it
  if (roomName.match(/^GH \d+[AB]?$/)) {
    return roomName;
  }
  
  // First try to match L-prefixed rooms (KGHL110 format)
  const lMatch = roomName.match(/K(GHL\d+)/);
  if (lMatch) {
    return lMatch[1].replace(/(GH)(L)(\d+)/, 'GH $2$3');
  }
  
  // Then try to match regular rooms
  const match = roomName.match(/K(GH\d+[AB]?)/);
  if (!match) {
    return null;
  }
  
  // Add space between GH and number, preserving A/B suffix if present
  const roomNumber = match[1];
  return roomNumber.replace(/(GH)(\d+)([AB]?)/, 'GH $2$3');
};

/**
 * Determine event type and return appropriate styling information
 * @param event - The event object with new field names
 * @returns Object containing event type flags and background color
 */
export const getEventTypeInfo = (event: Event): EventTypeInfo => {
  const isStudentEvent = event.event_type?.toLowerCase().includes('student') || false;
  const isFacStaffEvent = event.event_type?.toLowerCase().includes('facstaff') || false;
  const isClass = event.event_name?.includes("Class") || false;
  const isSpecial = event.event_name?.includes("Workshop") || event.event_name?.includes("Summit") || false;
  const isLecture = event.event_type === 'Lecture';
  
  let bgColor = "bg-gray-400"; // Default light gray color for non-lecture events
  if (isStudentEvent) bgColor = "bg-[#b8a68a]";
  else if (isFacStaffEvent) bgColor = "bg-[#9b8ba5]";
  else if (isClass) bgColor = "bg-gray-400";
  else if (isSpecial) bgColor = "bg-[#9b8ba5]";
  else if (isLecture) bgColor = "noise-bg"; // Keep lecture events with the purple noise background

  return {
    isStudentEvent,
    isFacStaffEvent,
    isClass,
    isSpecial,
    isLecture,
    bgColor
  };
};

/**
 * Calculate event positioning and dimensions for grid display
 * @param event - The event object
 * @param startHour - The start hour of the grid
 * @param pixelsPerMinute - Pixels per minute for scaling
 * @param roomLabelWidth - Width of room labels (default: 96)
 * @param eventMargin - Margin between events (default: 1)
 * @returns Object containing positioning and dimension values
 */
export const calculateEventPosition = (
  event: Event, 
  startHour: number, 
  pixelsPerMinute: number, 
  roomLabelWidth: number = 96, 
  eventMargin: number = 1
): EventPosition => {
  // Parse start_time and end_time from ISO strings
  const startTime = new Date(event.start_time || '');
  const endTime = new Date(event.end_time || '');
  
  // Adjust for timezone offset since timestamps are stored as Chicago time
  // but JavaScript interprets them as UTC
  const timezoneOffset = startTime.getTimezoneOffset() * 60 * 1000; // Convert minutes to milliseconds
  const adjustedStartTime = new Date(startTime.getTime() + timezoneOffset);
  const adjustedEndTime = new Date(endTime.getTime() + timezoneOffset);
  
  // Convert to hours (e.g., 13.5 for 1:30 PM)
  const startHourDecimal = adjustedStartTime.getHours() + (adjustedStartTime.getMinutes() / 60);
  const endHourDecimal = adjustedEndTime.getHours() + (adjustedEndTime.getMinutes() / 60);
  
  // Calculate minutes from start of day
  const startMinutes = Math.round((startHourDecimal - startHour) * 60);
  const endMinutes = Math.round((endHourDecimal - startHour) * 60);
  const durationMinutes = endMinutes - startMinutes;
  
  return {
    startMinutes,
    endMinutes,
    durationMinutes,
    left: `${(startMinutes * pixelsPerMinute + eventMargin) - roomLabelWidth}px`,
    width: `${durationMinutes * pixelsPerMinute - eventMargin * 2}px`
  };
}; 
