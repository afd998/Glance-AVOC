import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Database } from "../../../../types/supabase";
import { formatTime } from "../../../../utils/timeUtils";
import { getEventThemeColors } from "../../../../utils/eventUtils";
import { useOccurrences } from "../../../../hooks/useOccurrences";
import { useUserProfile } from "../../../../core/User/useUserProfile";
import { useEventOwnership } from "../../../../core/event/hooks/useCalculateOwners";
import { useEventChecksComplete } from "../hooks/useEventChecksComplete";
import { useEvent } from "../../../../core/event/hooks/useEvent";
import { useEventResources } from "../../../../core/event/hooks/useEvent";
import { useEventDurationHours } from "../../hooks/useEvents";
import UserAvatar from "../../../../core/User/UserAvatar";
import { Monitor } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../components/ui/tooltip";

type Event = Database["public"]["Tables"]["events"]["Row"];

interface EventHeaderProps {
  eventId: number;
  date?: string;
  isHovering: boolean;
}

export default function EventHeader({
  eventId,
  date,
  isHovering = false,
}: EventHeaderProps) {
  // Get event data from useEvent hook (will use cache if available)
  const { data: currentEvent } = useEvent(eventId, date);

  // Early return if no event data
  if (!currentEvent) {
    return null;
  }

  // Get all occurrences of this event and isFirstSession flag
  const { data: occurrencesData } = useOccurrences(currentEvent);
  if (eventId === 264405247151647) {
    
    console.log("matsa", occurrencesData);
  }else{
    console.log("not matsa", occurrencesData);
  }

  const occurrences = occurrencesData?.occurrences || [];
  const isFirstSession = occurrencesData?.isFirstSession || false;

  // Get ownership data including timeline
  const { data: ownershipData } = useEventOwnership(currentEvent.id);

  // Get timeline entries
  const timeline = ownershipData?.timeline || [];

  // Get Panopto checks functionality
  const { isComplete: allChecksComplete, isLoading: checksLoading } =
    useEventChecksComplete(
      currentEvent.id,
      currentEvent.start_time || undefined,
      currentEvent.end_time || undefined,
      currentEvent.date || undefined
    );

  // Get parsed event resources and computed flags from cache
  const { data: resourcesData } = useEventResources(currentEvent.id);
  const resources = resourcesData?.resources || [];

  // Get pre-computed boolean flags from cache
  const hasVideoRecording = resourcesData?.hasVideoRecording || false;
  const hasStaffAssistance = resourcesData?.hasStaffAssistance || false;
  const hasHandheldMic = resourcesData?.hasHandheldMic || false;
  const hasWebConference = resourcesData?.hasWebConference || false;
  const hasClickers = resourcesData?.hasClickers || false;
  const hasAVNotes = resourcesData?.hasAVNotes || false;
  const hasNeatBoard = resourcesData?.hasNeatBoard || false;

  // Get theme colors for this event type
  const themeColors = getEventThemeColors(currentEvent);

  // Check if all Panopto checks are complete for this event (using React Query properly)
  const { isComplete, isLoading, error } = useEventChecksComplete(
    currentEvent.id,
    currentEvent.start_time || undefined,
    currentEvent.end_time || undefined,
    currentEvent.date || undefined
  );

  // Format start and end times from HH:MM:SS format (memoized)
  const formatTimeFromISO = useCallback((timeString: string | null) => {
    if (!timeString) return "";
    try {
      // Parse HH:MM:SS format
      const [hours, minutes] = timeString.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      // If minutes are 00, show just the hour
      if (minutes === 0) {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        });
      } else {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
    } catch (error) {
      console.error("Error formatting time:", timeString, error);
      return "";
    }
  }, []);

  // Memoize the time display calculation
  const timeDisplay = useMemo(() => {
    return `${formatTimeFromISO(currentEvent.start_time)} - ${formatTimeFromISO(
      currentEvent.end_time
    )}`;
  }, [formatTimeFromISO, currentEvent.start_time, currentEvent.end_time]);

  // Get cached event duration in hours
  const { data: eventDurationHours = 0 } = useEventDurationHours(
    currentEvent.id
  );
  const isShortLecture =
    currentEvent.event_type === "Lecture" && eventDurationHours < 2;

  return (
    <div
      className={`flex  text-foreground justify-between items-center h-5 py-0.5 transition-all duration-200 ease-in-out absolute top-0 left-1 right-0 z-100`}
    >
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span
          className={`text-xs font-medium opacity-90 truncate transition-all duration-200 ease-in-out ${
            currentEvent.event_type === "Ad Hoc Class Meeting"
              ? isHovering
                ? "text-white"
                : "text-gray-600"
              : currentEvent.event_type === "Lecture"
              ? "text-black"
              : "text-foreground"
          }`}
          title={timeDisplay}
          style={{
            transform: isHovering ? "scale(1.1)" : "scale(1)",
            transformOrigin: "left center",
          }}
        >
          {timeDisplay}
        </span>
      </div>
      {/* Only show the container if there are resources or assignees */}
      {(isFirstSession || resources.length > 0 || timeline.length > 0) && (
        <div
          className={`flex items-center gap-1 shrink-0 transition-all duration-200 ease-in-out overflow-visible bg-black/25  rounded-md px-2 py-1 mt-2`}
        >
          {isFirstSession && (
            <span
              className="text-yellow-500 dark:text-yellow-400 text-xs font-bold transition-all duration-250 ease-in-out cursor-pointer relative"
              title="First Session"
            >
              !
            </span>
          )}
          {resources
            .filter((resource) => resource.isAVResource)
            .filter(
              (resource) =>
                resource.itemName !== "KSM-KGH-AV-Lapel Microphone" &&
                resource.itemName !== "KSM-KGH-AV-Display Adapter" &&
                resource.itemName !== "KSM-KGH-AV-Presentation Clicker"
            )
            .map((resource, index) => (
              <Tooltip key={`resource-${index}`}>
                <TooltipTrigger asChild>
                  <div className="transition-all duration-250 ease-in-out cursor-pointer relative">
                    <div className="relative">
                      {resource.icon}
                      {resource.displayName === "Video Recording" &&
                        allChecksComplete && (
                          <div className="absolute top-0 right-0">
                            <svg
                              className="text-green-400"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              viewBox="0 0 20 20"
                              style={{
                                width: "8px",
                                height: "8px",
                              }}
                            >
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          </div>
                        )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {resource.displayName === "Video Recording" &&
                    allChecksComplete
                      ? "Video Recording - All Checks Complete"
                      : resource.displayName}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}

          {/* Separator bar between resource icons and owner icons */}
          {(isFirstSession || resources.length > 0) && timeline.length > 0 && (
            <div className="w-0.5 h-4 bg-white dark:bg-gray-800 mx-0.5 opacity-20"></div>
          )}

          {/* Owner Avatars */}
          {timeline.length > 0 && (
            <div className="flex items-center gap-0.5">
              {timeline.map((entry, index) => (
                <React.Fragment key={entry.ownerId}>
                  {/* Owner Avatar */}
                  <div
                    className="transition-all duration-200 ease-in-out"
                    title={`Assigned to: ${entry.ownerId}`}
                    style={{
                      transform: isHovering ? "scale(1.2)" : "scale(1)",
                    }}
                  >
                    <UserAvatar userId={entry.ownerId} size="xs" />
                  </div>

                  {/* Arrow (if not the last owner) */}
                  {index < timeline.length - 1 && (
                    <svg
                      className="w-3 h-3 text-white transition-all duration-200 ease-in-out"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{
                        transform: isHovering ? "scale(1.2)" : "scale(1)",
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
