import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useBackground } from '../features/ThemeModal/useBackground';
import { useProfile } from '../core/User/useProfile';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const { theme: profileTheme, updateTheme } = useProfile();

  const [localTheme, setLocalTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.localStorage.getItem('avoc-guest-theme') || 'light';
  });

  const effectiveTheme = useMemo(() => {
    if (user && profileTheme) {
      return profileTheme;
    }
    return localTheme;
  }, [user, profileTheme, localTheme]);

  const isDarkMode = effectiveTheme === 'dark';

  const setIsDarkMode = useCallback(
    (darkMode) => {
      const newTheme = darkMode ? 'dark' : 'light';

      if (user) {
        if (profileTheme !== newTheme) {
          updateTheme(newTheme);
        }
      } else {
        setLocalTheme(newTheme);
      }
    },
    [user, updateTheme, profileTheme]
  );

  // Persist guest theme preference
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      window.localStorage.setItem('avoc-guest-theme', localTheme);
    }
  }, [localTheme, user]);

  // When a profile theme is available (signed-in user), sync local theme so it
  // matches once they sign out and return to the landing page.
  useEffect(() => {
    if (user && profileTheme) {
      setLocalTheme(profileTheme);
    }
  }, [user, profileTheme]);

  // Apply theme classes to the document root based on the effective theme.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.setAttribute('data-theme-controlled', 'true');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
      setIsDarkMode,
      toggleDarkMode: () => setIsDarkMode(!isDarkMode),
      currentTheme: getTheme(),
      getTheme,
      profileTheme: effectiveTheme,
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
