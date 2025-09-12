import React, { createContext, useContext, useState, useEffect } from 'react';

interface SnowContextType {
  isSnowEnabled: boolean;
  toggleSnow: () => void;
}

const SnowContext = createContext<SnowContextType | undefined>(undefined);

export function SnowProvider({ children }: { children: React.ReactNode }) {
  const [isSnowEnabled, setIsSnowEnabled] = useState(false);

  const toggleSnow = () => {
    setIsSnowEnabled(prev => !prev);
  };

  return (
    <SnowContext.Provider value={{ isSnowEnabled, toggleSnow }}>
      {children}
    </SnowContext.Provider>
  );
}

export function useSnow() {
  const context = useContext(SnowContext);
  if (context === undefined) {
    throw new Error('useSnow must be used within a SnowProvider');
  }
  return context;
}
