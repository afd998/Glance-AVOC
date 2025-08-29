import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LeavesContextType {
  isLeavesEnabled: boolean;
  toggleLeaves: () => void;
  setLeavesSettings: (settings: {
    isLeavesEnabled?: boolean;
  }) => void;
}

const LeavesContext = createContext<LeavesContextType | undefined>(undefined);

interface LeavesProviderProps {
  children: ReactNode;
}

export const LeavesProvider: React.FC<LeavesProviderProps> = ({ children }) => {
  const [isLeavesEnabled, setIsLeavesEnabled] = useState(true); // Default to enabled for Halloween

  const toggleLeaves = () => setIsLeavesEnabled(prev => !prev);

  const setLeavesSettings = (settings: {
    isLeavesEnabled?: boolean;
  }) => {
    if (settings.isLeavesEnabled !== undefined) setIsLeavesEnabled(settings.isLeavesEnabled);
  };

  return (
    <LeavesContext.Provider value={{
      isLeavesEnabled,
      toggleLeaves,
      setLeavesSettings
    }}>
      {children}
    </LeavesContext.Provider>
  );
};

export const useLeaves = (): LeavesContextType => {
  const context = useContext(LeavesContext);
  if (context === undefined) {
    throw new Error('useLeaves must be used within a LeavesProvider');
  }
  return context;
};
