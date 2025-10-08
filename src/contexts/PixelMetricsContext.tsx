import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PixelMetricsContextType {
  basePixelsPerMinute: number;
  setBasePixelsPerMinute: (pixels: number) => void;
  baseRowHeightPx: number;
  setBaseRowHeightPx: (height: number) => void;
  pixelsPerMinute: number;
  rowHeightPx: number;
  scheduleStartHour: number;
  scheduleEndHour: number;
  setScheduleHours: (start: number, end: number) => void;
}

const PixelMetricsContext = createContext<PixelMetricsContextType | undefined>(undefined);

export const usePixelMetrics = () => {
  const context = useContext(PixelMetricsContext);
  if (context === undefined) {
    throw new Error('usePixelMetrics must be used within a PixelMetricsProvider');
  }
  return context;
};

interface PixelMetricsProviderProps {
  children: ReactNode;
}

export const PixelMetricsProvider: React.FC<PixelMetricsProviderProps> = ({ children }) => {
  const [basePixelsPerMinute, setBasePixelsPerMinute] = useState<number>(2);
  const [baseRowHeightPx, setBaseRowHeightPx] = useState<number>(96);
  const [[scheduleStartHour, scheduleEndHour], setScheduleHoursState] = useState<[number, number]>([7, 23]);

  // Use base metrics; visual zoom is applied via CSS zoom on the grid wrapper
  const pixelsPerMinute = basePixelsPerMinute;
  const rowHeightPx = baseRowHeightPx;

  const setScheduleHours = useCallback((start: number, end: number) => {
    const clampedStart = Math.max(0, Math.min(22, Math.round(start)));
    const clampedEnd = Math.max(clampedStart + 1, Math.min(23, Math.round(end)));
    setScheduleHoursState((prev) => {
      if (prev[0] === clampedStart && prev[1] === clampedEnd) {
        return prev;
      }
      return [clampedStart, clampedEnd];
    });
  }, [setScheduleHoursState]);

  return (
    <PixelMetricsContext.Provider value={{
      basePixelsPerMinute,
      setBasePixelsPerMinute,
      baseRowHeightPx,
      setBaseRowHeightPx,
      pixelsPerMinute,
      rowHeightPx,
      scheduleStartHour,
      scheduleEndHour,
      setScheduleHours
    }}>
      {children}
    </PixelMetricsContext.Provider>
  );
};

