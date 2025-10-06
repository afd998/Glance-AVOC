import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBackground } from '../features/ThemeModal/useBackground';
import { useProfile } from '../core/User/useProfile';

const ThemeContext = createContext();

// Theme definitions (name metadata only)
const THEMES = {
  'none': { name: 'No Image' },
  'AVOC.JPEG': { name: 'AVOC' },
  'Gies.avif': { name: 'Gies' },
  'dusk.jpg': { name: 'Dusk' },
  'Vista.avif': { name: 'Vista' },
  'halloween.png': { name: 'Halloween' },
  'Ryan Fieldhouse.jpg': { name: 'Ryan Fieldhouse' },
  'jaobscenter.jpeg': { name: 'Jacobs Center' },
  'offwhite': { name: 'Off White' }
};

export function ThemeProvider({ children }) {
  const { currentBackground } = useBackground();
  const { theme: profileTheme, updateTheme, isLoading: isProfileLoading } = useProfile();

  // Convert profile theme to boolean for dark mode
  const isDarkMode = profileTheme === 'dark';
  
  // Function to update theme in profile
  const setIsDarkMode = (darkMode) => {
    const newTheme = darkMode ? 'dark' : 'light';
    updateTheme(newTheme);
  };

  // Apply theme immediately when profile theme changes
  useEffect(() => {
    if (!isProfileLoading && profileTheme) {
      // Remove any system theme classes first
      document.documentElement.classList.remove('dark');

      // Apply our custom theme based on profile
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Set a data attribute to indicate we're controlling the theme
      document.documentElement.setAttribute('data-theme-controlled', 'true');
    }
  }, [profileTheme, isDarkMode, isProfileLoading]);

  // Apply initial theme state immediately (before any other effects)
  useEffect(() => {
    // Force remove dark class on initial load to prevent system inheritance
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme-controlled', 'true');
    
    // If we have a profile theme, apply it immediately
    if (profileTheme) {
      if (profileTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [profileTheme]);

  const currentTheme = THEMES[currentBackground] || THEMES['Vista.avif'];

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
      setDarkMode: setIsDarkMode,
      toggleDarkMode: () => setIsDarkMode(!isDarkMode),
      currentTheme: getTheme(),
      getTheme,
      profileTheme,
      updateTheme
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
