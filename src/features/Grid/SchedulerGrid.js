import React, { useState } from "react";
import Event from "../Event/Event";
import "../index.css";

const rooms = [
  "GH L110", "GH L120", "GH L130", "GH L070", "GH 1110", "GH 1120", "GH 1130",
  "GH 1420", "GH 1430", "GH 2110", "GH 2120", "GH 2130", "GH 2410", "GH 2420",
  "GH 4101", "GH 4301", "GH 4302", "GH 5101", "GH 5201", "GH 5301"
];

const sampleEvents = [
  {
    room: "GH 1420",
    startTime: new Date(2025, 4, 9, 9, 0),
    endTime: new Date(2025, 4, 9, 10, 30),
    label: "Team Sync"
  },
  {
    room: "GH 1110",
    startTime: new Date(2025, 4, 9, 8, 30),
    endTime: new Date(2025, 4, 9, 9, 15),
    label: "Interview"
  },
  {
    room: "GH 2120",
    startTime: new Date(2025, 4, 9, 13, 0),
    endTime: new Date(2025, 4, 9, 14, 0),
    label: "Workshop"
  }
];

export default function App() {
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(17);
  const pixelsPerMinute = 2;

  const totalMinutes = (endHour - startHour) * 60;
  const totalWidth = totalMinutes * pixelsPerMinute;

  const renderTimeLabels = () => {
    const times = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      times.push(
        <div
          key={hour}
          className="text-xs text-center text-gray-500 border-r"
          style={{ width: 60 * pixelsPerMinute }}
        >
          {hour}:00
        </div>
      );
    }
    return times;
  };

  return (
    <div className="p-4">
      {/* Time labels */}
      <div className="flex ml-32 border-t border-b border-gray-300 bg-gray-100">
        {renderTimeLabels()}
      </div>

      <div className="flex border mt-0 h-fit">
        {/* Y-axis labels */}
        <div className="flex flex-col sticky left-0 bg-white z-10 border-r w-32">
          {rooms.map((room, idx) => (
            <div
              key={room}
              className="h-10 flex items-center justify-end pr-2 border-b text-sm text-gray-600"
            >
              {room}
            </div>
          ))}
        </div>

        {/* Scrollable grid */}
        <div className="overflow-x-auto w-full">
          <div style={{ width: totalWidth }} className="relative">
            {/* Grid lines */}
            {rooms.map((room, idx) => (
              <div
                key={room}
                className="absolute left-0 right-0 border-b border-gray-200"
                style={{ top: idx * 40, height: 40 }}
              />
            ))}

            {/* Events */}
            {sampleEvents.map((event, index) => (
              <Event
                key={index}
                {...event}
                startHour={startHour}
                pixelsPerMinute={pixelsPerMinute}
                rooms={rooms}
                hasOverduePanoptoChecks={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 