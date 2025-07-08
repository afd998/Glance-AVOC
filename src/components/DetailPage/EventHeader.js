import React from 'react';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import { parseRoomName } from '../../utils/eventUtils';

export default function EventHeader({ 
  event, 
  facultyMember, 
  isFacultyLoading,
  hasVideoRecording,
  panoptoUrl,
  isPanoptoLoading,
  isCorsError,
  needsPanoptoAuth,
  onManualPanoptoSearch
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        {/* Left Side - Event Info */}
        <div className="flex-1 w-1/2">
          {/* Main Heading - Department Name for Lectures, Full Title for others */}
          {event.eventType === "Lecture" && event.itemName && event.itemName.length >= 4 ? (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {getDepartmentName(event.itemName.substring(0, 4))}
            </h1>
          ) : event.itemName ? (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {event.itemName}
            </h1>
          ) : null}
          
          {/* Lecture Title */}
          {event.lectureTitle && (
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {event.lectureTitle}
            </h2>
          )}
          
          {/* Session Code */}
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
            {event.itemName}
          </p>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">{formatDate(event.subject_item_date)}</p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {formatTime(event.start)} - {formatTime(event.end)}
          </p>
        </div>

        {/* Right Side - Event Type/Room and Instructor Info */}
        {event.instructorName && (
          <div className="flex flex-col items-start gap-4 ml-8 w-1/2">
            {/* Event Type and Room side by side at the top */}
            <div className="flex flex-row gap-6 w-full mb-2">
              {event.eventType && (
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Event Type</h2>
                  <p className="text-gray-700 dark:text-gray-300">{event.eventType}</p>
                </div>
              )}
              {event.subject_itemName && (
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Room</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {parseRoomName(event.subject_itemName) || event.subject_itemName}
                  </p>
                </div>
              )}
            </div>
            {/* Faculty Info below */}
            <div className="flex items-center gap-4 w-full">
              {facultyMember?.imageUrl ? (
                <a 
                  href={facultyMember?.bioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                  title={`View ${event.instructorName}'s bio`}
                >
                  <div className="relative">
                    <img 
                      src={facultyMember.imageUrl} 
                      alt={event.instructorName}
                      className="h-20 w-20 rounded-full object-cover filter grayscale opacity-80"
                      onError={(e) => {
                        console.error('Error loading faculty image:', facultyMember.imageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 rounded-full bg-[#886ec4] mix-blend-overlay opacity-30"></div>
                  </div>
                </a>
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  {facultyMember?.name ? `Dr. ${facultyMember.name}` : event.instructorName}
                </h3>
                {facultyMember?.title && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{facultyMember.title}</p>
                )}
                {isFacultyLoading && (
                  <p className="text-gray-500 dark:text-gray-400">Loading faculty information...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {hasVideoRecording && !panoptoUrl && !isPanoptoLoading && !isCorsError && (
          <button
            onClick={onManualPanoptoSearch}
            className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1 whitespace-nowrap bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg"
            title="Debug: Search for Panopto Recording"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Debug Search
          </button>
        )}
        {isPanoptoLoading && (
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            Searching...
          </div>
        )}
        {panoptoUrl && (
          <a 
            href={panoptoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1 whitespace-nowrap bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg"
            title="View Recording"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            View Recording
          </a>
        )}
        {isCorsError && (
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              Panopto integration requires server-side implementation. 
              <a 
                href="https://kellogg-northwestern.hosted.panopto.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                Search manually
              </a>
            </span>
          </div>
        )}
        {needsPanoptoAuth && (
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <a 
              href="https://kellogg-northwestern.hosted.panopto.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Log into Panopto
            </a>
            to view recordings
          </div>
        )}
        {event.eventUrl && (
          <a 
            href={event.eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 whitespace-nowrap bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
            title="View in 25Live"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            View in 25Live
          </a>
        )}
      </div>
    </div>
  );
} 
