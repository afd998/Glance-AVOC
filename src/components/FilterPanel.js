import React from 'react';
import DatePicker from "react-datepicker";
import TimeWindowPicker from "./TimeWindowPicker";

function FilterPanel({ 
  selectedDate, 
  setSelectedDate, 
  startHour, 
  endHour, 
  onStartHourChange, 
  onEndHourChange,
  rooms,
  selectedRooms,
  setSelectedRooms
}) {
  return (
    <div className="flex items-start space-x-8 bg-white p-4 rounded-lg shadow-lg border">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          dateFormat="MMM d, yyyy"
        />
      </div>
      <TimeWindowPicker
        startHour={startHour}
        endHour={endHour}
        onStartHourChange={onStartHourChange}
        onEndHourChange={onEndHourChange}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Rooms</label>
        <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-white">
          <div className="grid grid-cols-2 gap-x-4">
            {rooms.map((room) => (
              <label key={room} className="flex items-center space-x-2 py-0.5 hover:bg-gray-50 px-2 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRooms([...selectedRooms, room]);
                    } else {
                      setSelectedRooms(selectedRooms.filter(r => r !== room));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{room}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel; 