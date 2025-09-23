import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBackground } from '../hooks/useBackground';

const ThemeContext = createContext();

// Theme definitions with their light/dark settings
const THEMES = {
  'AVOC.JPEG': { isDark: false, name: 'AVOC' },
  'Gies.avif': { isDark: false, name: 'Gies' },
  'dusk.jpg': { isDark: false, name: 'Dusk' },
  'Vista.avif': { isDark: false, name: 'Vista' },
  'halloween.png': { isDark: true, name: 'Halloween' },
  'Ryan Fieldhouse.jpg': { isDark: false, name: 'Ryan Fieldhouse' },
  'jaobscenter.jpeg': { isDark: false, name: 'Jacobs Center' },
  'offwhite': { isDark: false, name: 'Off White' }
};

export function ThemeProvider({ children }) {
  const { currentBackground } = useBackground();
  
  // Get current theme based on background
  const currentTheme = THEMES[currentBackground] || THEMES['Vista.avif'];
  const isDarkMode = currentTheme.isDark;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const getTheme = () => {
    return {
      ...currentTheme,
      isDarkMode,
      background: currentBackground
    };
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      currentTheme: getTheme(),
      getTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 
