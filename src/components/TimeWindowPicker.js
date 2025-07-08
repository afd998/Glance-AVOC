import React from 'react';

function TimeWindowPicker({ startHour, endHour, onStartHourChange, onEndHourChange }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour) => {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:00 ${ampm}`;
  };

  return (
    <div className="flex items-center space-x-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
        <select
          value={startHour}
          onChange={(e) => onStartHourChange(Number(e.target.value))}
          className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {formatHour(hour)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
        <select
          value={endHour}
          onChange={(e) => onEndHourChange(Number(e.target.value))}
          className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {formatHour(hour)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default TimeWindowPicker;
