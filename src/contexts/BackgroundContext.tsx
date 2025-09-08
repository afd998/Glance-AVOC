import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BackgroundContextType {
  currentBackground: string;
  setCurrentBackground: (background: string) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

interface BackgroundProviderProps {
  children: ReactNode;
}

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({ children }) => {
  const [currentBackground, setCurrentBackground] = useState<string>('Vista.avif');

  return (
    <BackgroundContext.Provider value={{ currentBackground, setCurrentBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = (): BackgroundContextType => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
