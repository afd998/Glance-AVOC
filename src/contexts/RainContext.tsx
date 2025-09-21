import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RainContextType {
  isRainEnabled: boolean;
  toggleRain: () => void;
  setRainSettings: (settings: {
    isRainEnabled?: boolean;
  }) => void;
}

const RainContext = createContext<RainContextType | undefined>(undefined);

interface RainProviderProps {
  children: ReactNode;
}

export const RainProvider: React.FC<RainProviderProps> = ({ children }) => {
  const [isRainEnabled, setIsRainEnabled] = useState(false);

  const toggleRain = () => setIsRainEnabled(prev => !prev);

  const setRainSettings = (settings: {
    isRainEnabled?: boolean;
  }) => {
    if (settings.isRainEnabled !== undefined) setIsRainEnabled(settings.isRainEnabled);
  };

  return (
    <RainContext.Provider value={{
      isRainEnabled,
      toggleRain,
      setRainSettings
    }}>
      {children}
    </RainContext.Provider>
  );
};

export const useRain = (): RainContextType => {
  const context = useContext(RainContext);
  if (context === undefined) {
    throw new Error('useRain must be used within a RainProvider');
  }
  return context;
};
