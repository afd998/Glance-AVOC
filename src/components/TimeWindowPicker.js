import React from "react";

export default function TimeWindowPicker({ startHour, endHour, onStartHourChange, onEndHourChange, hourOnly }) {
  const generateHourOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      options.push(
        <option key={h} value={h}>
          {label}
        </option>
      );
    }
    return options;
  };

  return (
    <div className="flex items-center gap-4">
      <label className="flex flex-col">
        Start Hour
        <select
          className="border px-2 py-1 rounded"
          value={startHour}
          onChange={(e) => onStartHourChange(parseInt(e.target.value))}
        >
          {generateHourOptions()}
        </select>
      </label>

      <label className="flex flex-col">
        End Hour
        <select
          className="border px-2 py-1 rounded"
          value={endHour}
          onChange={(e) => onEndHourChange(parseInt(e.target.value))}
        >
          {generateHourOptions()}
        </select>
      </label>
    </div>
  );
}