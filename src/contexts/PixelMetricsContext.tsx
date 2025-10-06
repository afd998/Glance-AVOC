import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PixelMetricsContextType {
  basePixelsPerMinute: number;
  setBasePixelsPerMinute: (pixels: number) => void;
  baseRowHeightPx: number;
  setBaseRowHeightPx: (height: number) => void;
  pixelsPerMinute: number;
  rowHeightPx: number;
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

  // Use base metrics; visual zoom is applied via CSS zoom on the grid wrapper
  const pixelsPerMinute = basePixelsPerMinute;
  const rowHeightPx = baseRowHeightPx;

  return (
    <PixelMetricsContext.Provider value={{
      basePixelsPerMinute,
      setBasePixelsPerMinute,
      baseRowHeightPx,
      setBaseRowHeightPx,
      pixelsPerMinute,
      rowHeightPx
    }}>
      {children}
    </PixelMetricsContext.Provider>
  );
};

