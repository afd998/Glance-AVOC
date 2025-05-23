import React, { useState } from "react";
import TimeWindowPicker from "./components/TimeWindowPicker";
import Event from "./components/Event";
import { processedEvents } from "./data/processedEvents";
import "./index.css";

const rooms = [
  "GH L110", "GH L120", "GH L130", "GH L070", "GH 1110", "GH 1120", "GH 1130",
  "GH 1420", "GH 1430", "GH 2110", "GH 2120", "GH 2130", "GH 2410", "GH 2420",
  "GH 4101", "GH 4301", "GH 4302", "GH 5101", "GH 5201", "GH 5301"
];

export default function App() {
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(17);
  const pixelsPerMinute = 2;

  const totalMinutes = (endHour - startHour) * 60;
  const totalWidth = totalMinutes * pixelsPerMinute;

  // Generate hour labels and grid lines
  const hourLabels = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const minutes = (hour - startHour) * 60;
    const left = minutes * pixelsPerMinute;
    hourLabels.push(
      <div
        key={hour}
        className="absolute top-0 text-sm text-gray-600"
        style={{ left: left }}
      >
        {hour}:00
      </div>
    );
  }

  return (
    <div className="p-4">
      <TimeWindowPicker
        startHour={startHour}
        endHour={endHour}
        onStartHourChange={setStartHour}
        onEndHourChange={setEndHour}
      />

      <div className="flex border mt-4 h-fit">
        {/* Y-axis labels */}
        <div className="flex flex-col sticky left-0 bg-white z-10 border-r w-32">
          <div className="h-10 border-b"></div> {/* Spacer for hour labels */}
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
            {/* Hour labels */}
            <div className="h-10 relative border-b">
              {hourLabels}
            </div>

            {/* Grid container */}
            <div className="relative" style={{ height: rooms.length * 40 }}>
              {/* Vertical grid lines */}
              {hourLabels.map((_, index) => {
                const hour = startHour + index;
                const minutes = (hour - startHour) * 60;
                const left = minutes * pixelsPerMinute;
                return (
                  <div
                    key={`vline-${hour}`}
                    className="absolute top-0 bottom-0 border-l border-gray-300"
                    style={{ 
                      left: left,
                      height: '100%',
                      zIndex: 0
                    }}
                  />
                );
              })}

              {/* Horizontal grid lines */}
              {rooms.map((room, idx) => (
                <div
                  key={room}
                  className="absolute left-0 right-0 border-b border-gray-200"
                  style={{ 
                    top: idx * 40, 
                    height: 40,
                    zIndex: 0
                  }}
                />
              ))}

              {/* Events */}
              <div className="relative" style={{ zIndex: 1 }}>
                {processedEvents.map((event, index) => (
                  <Event
                    key={index}
                    {...event}
                    startHour={startHour}
                    pixelsPerMinute={pixelsPerMinute}
                    rooms={rooms}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}