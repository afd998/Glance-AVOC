"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
type LandingPageNavBarProps = {
  onLogin?: () => void;
};

const LandingPageNavBar: React.FC<LandingPageNavBarProps> = ({ onLogin }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  return (
    <nav className=" absolute z-10  bg-transparent flex w-full items-center justify-between border-t  border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="  flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <img
          src="/wildcat2.png"
          alt="AVOC Logo"
          className="size-10 rounded-full object-cover ring-violet-400/40 transition duration-300 ease-out hover:-translate-y-0.5 hover:ring-violet-300/60 dark:brightness-175 contrast-110"
        />
        <h1 className="text-base font-bold md:text-2xl">AVOC Home</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center gap-2 rounded-lg border bg-background border-neutral-200 px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
          aria-pressed={isDarkMode}
        >
          {isDarkMode ? (
            <>
              <Moon className=" h-4 w-4" aria-hidden="true" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" aria-hidden="true" />
              <span>Light</span>
            </>
          )}
          <span className="sr-only">Toggle dark mode</span>
        </button>
        <button
          type="button"
          className="w-24 transform rounded-lg bg-black px-6 py-2 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          onClick={onLogin}
        >
          Login
        </button>
      </div>
    </nav>
  );
};

export default LandingPageNavBar;
