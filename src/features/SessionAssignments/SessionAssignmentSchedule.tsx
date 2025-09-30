import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserProfiles } from '../../core/User/useUserProfiles';
import { useShifts, Shift } from './hooks/useShifts';
import { useUpdateShift } from './hooks/useUpdateShift';
import { useQueryClient } from '@tanstack/react-query';

interface SessionAssignmentScheduleProps {
  dates: string[]; // Array of date strings in YYYY-MM-DD format
  selectedDate?: string; // Currently selected date for highlighting
  onDateSelect?: (date: string) => void; // Callback when a date is selected
  className?: string; // Additional CSS classes
}

// Helper function to format time labels
function formatTimeLabel(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Helper to convert 'HH:MM:SS' or 'HH:MM' to 'HH:MM'
function toHHMM(t: string | null | undefined): string {
  if (!t) return '06:00';
  return t.split(':').slice(0, 2).join(':');
}

// Helper to format date for display
function formatShortDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
}

function formatShortDay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

const SessionAssignmentSchedule: React.FC<SessionAssignmentScheduleProps> = ({
  dates,
  selectedDate,
  onDateSelect,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const { profiles, isLoading: profilesLoading, error: profilesError } = useUserProfiles();
  const { data: shifts, isLoading: shiftsLoading, error: shiftsError } = useShifts(dates);
  const updateShift = useUpdateShift();


  // Modal state for editing shifts
  const [editingCell, setEditingCell] = useState<{ profileId: string, date: string } | null>(null);
  const [modalStart, setModalStart] = useState<string>('06:00');
  const [modalEnd, setModalEnd] = useState<string>('07:00');

  // Time options (30-min increments from 6:00 to 23:00)
  const timeOptions: string[] = [];
  for (let h = 6; h <= 23; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`);
    if (h !== 23) timeOptions.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // Get shift for a specific profile and date
  const getShift = (profileId: string, date: string): Shift | undefined => {
    return shifts?.find(s => s.profile_id === profileId && s.date === date);
  };

  // Open modal with current shift values if present
  const openCellModal = (profileId: string, date: string) => {
    const shift = getShift(profileId, date);
    setModalStart(toHHMM(shift?.start_time) || '06:00');
    setModalEnd(toHHMM(shift?.end_time) || '07:00');
    setEditingCell({ profileId, date });
  };

  const closeCellModal = () => setEditingCell(null);

  // Handle saving a shift
  const handleSave = () => {
    if (!editingCell) return;
    
    updateShift.mutate({
      profile_id: editingCell.profileId,
      date: editingCell.date,
      start_time: modalStart,
      end_time: modalEnd,
    }, {
      onSuccess: () => {
        closeCellModal();
      },
      onError: (error) => {
        console.error('Shift create/update error:', error);
      }
    });
  };

  // Handle clearing a shift
  const handleClear = () => {
    if (!editingCell) return;
    
    updateShift.mutate({
      profile_id: editingCell.profileId,
      date: editingCell.date,
      start_time: null,
      end_time: null,
    }, {
      onSuccess: () => {
        closeCellModal();
      },
      onError: (error) => {
        console.error('Shift clear error:', error);
      }
    });
  };

 

  // Loading state
  if (profilesLoading || shiftsLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-lg text-gray-500 dark:text-gray-300">Loading schedule...</div>
      </div>
    );
  }

  // Error state
  if (profilesError || shiftsError) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-lg text-red-500">Error loading schedule data</div>
      </div>
    );
  }

  // Filter profiles to only show technicians
  const technicianProfiles = profiles?.filter(profile => 
    profile.roles && 
    Array.isArray(profile.roles) && 
    profile.roles.includes('TECHNICIAN')
  ) || [];

  return (
    <div className={className}>
      {/* Schedule Table */}
      <div className="overflow-x-auto w-full">
        <table className={`min-w-full border border-gray-400/30 dark:border-gray-600/30 rounded-xl overflow-hidden table-fixed backdrop-blur-sm bg-white/5 dark:bg-gray-800/5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <thead>
            <tr>
              <th className="px-4 py-2 bg-gray-200/20 dark:bg-gray-700/20 backdrop-blur-sm text-left border border-gray-400/30 dark:border-gray-600/30 w-40">
                Name
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className={`px-2 py-2 text-center border border-gray-400/30 dark:border-gray-600/30 cursor-pointer transition-all duration-200 ${
                    selectedDate === date 
                      ? 'bg-purple-600/90 text-white backdrop-blur-sm' 
                      : 'bg-gray-200/20 dark:bg-gray-700/20 text-gray-700 dark:text-gray-200 backdrop-blur-sm hover:bg-gray-300/30 dark:hover:bg-gray-600/30'
                  }`}
                  onClick={() => onDateSelect?.(date)}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{formatShortDay(date)}</span>
                    <span className="text-xs">{formatShortDate(date)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {technicianProfiles.map(profile => (
              <tr key={profile.id} className="border-t border-gray-400 dark:border-gray-600">
                <td className="px-4 py-2 font-medium whitespace-nowrap border border-gray-400/30 dark:border-gray-600/30 bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm">
                  {profile.name || profile.id}
                </td>
                {dates.map((date) => {
                  const shift = getShift(profile.id, date);
                  return (
                    <td
                      key={date}
                      className={`px-2 py-2 text-center border border-gray-400/30 dark:border-gray-600/30 cursor-pointer hover:bg-purple-100/30 dark:hover:bg-purple-900/15 transition-all duration-200 backdrop-blur-sm ${
                        selectedDate === date 
                          ? 'bg-purple-100/30 dark:bg-purple-900/15' 
                          : 'bg-white/5 dark:bg-gray-800/5'
                      }`}
                      onClick={() => openCellModal(profile.id, date)}
                    >
                      {shift && shift.start_time && shift.end_time ? (
                        <span className="text-xs flex flex-col items-center justify-center">
                          <span>{formatTimeLabel(shift.start_time)}</span>
                          <span>{formatTimeLabel(shift.end_time)}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Time Range Picker Modal */}
      {editingCell && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[10000]" onClick={closeCellModal}>
          <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-300/50 dark:border-gray-700/50 rounded-xl shadow-2xl p-8 w-full max-w-xs mx-4`} onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Set Time Range
            </h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Start Time
              </label>
              <select
                className="w-full p-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                value={modalStart}
                onChange={e => setModalStart(e.target.value)}
                disabled={updateShift.isPending}
              >
                {timeOptions.map(opt => (
                  <option key={opt} value={opt}>{formatTimeLabel(opt)}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                End Time
              </label>
              <select
                className="w-full p-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                value={modalEnd}
                onChange={e => setModalEnd(e.target.value)}
                disabled={updateShift.isPending}
              >
                {timeOptions.map(opt => (
                  <option key={opt} value={opt}>{formatTimeLabel(opt)}</option>
                ))}
              </select>
            </div>
            
            {updateShift.isError && (
              <div className="mb-2 text-red-600 text-sm">
                Error saving shift. Please try again.
              </div>
            )}
            
            {(updateShift.isPending) && (
              <div className="mt-2 text-purple-600 text-sm flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving shift...
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm hover:bg-red-200/80 dark:hover:bg-red-900/50 transition-all duration-200 border border-red-300/50 dark:border-red-700/50"
                disabled={updateShift.isPending}
              >
                Clear
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={closeCellModal}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-gray-300/80 dark:hover:bg-gray-600/80 transition-all duration-200 border border-gray-300/50 dark:border-gray-600/50"
                  disabled={updateShift.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-purple-600/90 backdrop-blur-sm hover:bg-purple-700/90 disabled:opacity-60 transition-all duration-200 border border-purple-500/50"
                  disabled={updateShift.isPending}
                >
                  {updateShift.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionAssignmentSchedule;
