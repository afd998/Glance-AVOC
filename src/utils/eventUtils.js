/**
 * Parse event resources and return both boolean flags and full resource list
 * @param {Object} event - The event object
 * @returns {Object} Object containing boolean flags and resource list
 */
export const parseEventResources = (event) => {
  // Find the matching reservation for the current date
  const matchingReservation = event.itemDetails?.occur?.prof?.[0]?.rsv?.[0];
  
  if (!matchingReservation || !matchingReservation.res) {
    return {
      hasVideoRecording: false,
      hasHandheldMic: false,
      hasStaffAssistance: false,
      hasWebConference: false,
      hasClickers: false,
      resources: []
    };
  }

  const resources = matchingReservation.res;

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
 * @param {string} itemName - The resource item name
 * @returns {string|Object} Icon emoji or JSX element
 */
export const getResourceIcon = (itemName) => {
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
      return (
        <img 
          src="/zoomicon.png" 
          alt="Web Conference" 
          className="w-6 h-6 object-contain dark:invert"
        />
      );
    case "KSM-KGH-AV-SRS Clickers (polling)":
      return (
        <img 
          src="/tp.png" 
          alt="Clickers" 
          className="w-6 h-6 object-contain dark:invert"
        />
      );
    default:
      return "📋";
  }
};

/**
 * Get a human-readable name for a resource
 * @param {string} itemName - The resource item name
 * @returns {string} Human-readable name
 */
export const getResourceDisplayName = (itemName) => {
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
 * @param {string} subjectItemName - The subject item name containing room info
 * @returns {string|null} Parsed room name or null if no match
 */
export const parseRoomName = (subjectItemName) => {
  if (!subjectItemName) {
    return null;
  }
  // First try to match L-prefixed rooms (KGHL110 format)
  const lMatch = subjectItemName.match(/K(GHL\d+)/);
  if (lMatch) {
    return lMatch[1].replace(/(GH)(L)(\d+)/, 'GH $2$3');
  }
  
  // Then try to match regular rooms
  const match = subjectItemName.match(/K(GH\d+[AB]?)/);
  if (!match) {
    return null;
  }
  
  // Add space between GH and number, preserving A/B suffix if present
  const roomNumber = match[1];
  return roomNumber.replace(/(GH)(\d+)([AB]?)/, 'GH $2$3');
};

/**
 * Determine event type and return appropriate styling information
 * @param {Object} event - The event object
 * @returns {Object} Object containing event type flags and background color
 */
export const getEventTypeInfo = (event) => {
  const isStudentEvent = event.eventType?.toLowerCase().includes('student');
  const isFacStaffEvent = event.eventType?.toLowerCase().includes('facstaff');
  const isClass = event.itemName?.includes("Class");
  const isSpecial = event.itemName?.includes("Workshop") || event.itemName?.includes("Summit");
  const isLecture = event.eventType === 'Lecture';
  
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
 * @param {Object} event - The event object
 * @param {number} startHour - The start hour of the grid
 * @param {number} pixelsPerMinute - Pixels per minute for scaling
 * @param {number} roomLabelWidth - Width of room labels (default: 96)
 * @param {number} eventMargin - Margin between events (default: 1)
 * @returns {Object} Object containing positioning and dimension values
 */
export const calculateEventPosition = (event, startHour, pixelsPerMinute, roomLabelWidth = 96, eventMargin = 1) => {
  const startTime = parseFloat(event.start);
  const endTime = parseFloat(event.end);
  
  // Calculate minutes from start of day
  const startMinutes = Math.round((startTime - startHour) * 60);
  const endMinutes = Math.round((endTime - startHour) * 60);
  const durationMinutes = endMinutes - startMinutes;
  
  return {
    startMinutes,
    endMinutes,
    durationMinutes,
    left: `${(startMinutes * pixelsPerMinute + eventMargin) - roomLabelWidth}px`,
    width: `${durationMinutes * pixelsPerMinute - eventMargin * 2}px`
  };
}; 
