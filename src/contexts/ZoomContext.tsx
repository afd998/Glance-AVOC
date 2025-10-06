import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ZoomContextType {
  pageZoom: number;
  setPageZoom: (zoom: number) => void;
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined);

export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (context === undefined) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
};

interface ZoomProviderProps {
  children: ReactNode;
}

export const ZoomProvider: React.FC<ZoomProviderProps> = ({ children }) => {
  const [pageZoom, setPageZoom] = useState<number>(1);

  return (
    <ZoomContext.Provider value={{ pageZoom, setPageZoom }}>
      {children}
    </ZoomContext.Provider>
  );
};
