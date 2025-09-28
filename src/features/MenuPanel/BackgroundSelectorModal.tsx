import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useBackground } from '../../hooks/useBackground';
import { useRain } from '../../contexts/RainContext';
import { useLeaves } from '../../contexts/LeavesContext';
import { useSnow } from '../../contexts/SnowContext';

interface BackgroundSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BackgroundSelectorModal: React.FC<BackgroundSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isDarkMode } = useTheme();
  const { currentBackground, setCurrentBackground, isUpdating } = useBackground();
  const { isRainEnabled, toggleRain } = useRain();
  const { isLeavesEnabled, toggleLeaves } = useLeaves();
  const { isSnowEnabled, toggleSnow } = useSnow();

  const backgroundOptions = [
    {
      id: 'AVOC.JPEG',
      name: 'AVOC',
      preview: '/AVOC.JPEG',
      description: 'AVOC building background'
    },
    {
      id: 'Gies.avif',
      name: 'Gies',
      preview: '/Gies.avif',
      description: 'Gies College of Business background'
    },
    {
      id: 'dusk.jpg',
      name: 'Dusk',
      preview: '/dusk.jpg',
      description: 'Dusk background with optional rain effect'
    },
    {
      id: 'Vista.avif',
      name: 'Vista',
      preview: '/Vista.avif',
      description: 'Vista background'
    },
    {
      id: 'halloween.png',
      name: 'Halloween',
      preview: '/halloween.png',
      description: 'Halloween themed background'
    },
    {
      id: 'Ryan Fieldhouse.jpg',
      name: 'Ryan Fieldhouse',
      preview: '/Ryan Fieldhouse.jpg',
      description: 'Northwestern University Ryan Fieldhouse background'
    },
    {
      id: 'jaobscenter.jpeg',
      name: 'Jacobs Center',
      preview: '/jaobscenter.jpeg',
      description: 'Jacobs Center background'
    },
    {
      id: 'offwhite',
      name: 'Off White',
      preview: null, // No image preview for CSS background
      description: 'Clean off-white CSS background'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl backdrop-blur-xl border ${
          isDarkMode 
            ? 'bg-gray-900/80 text-white border-gray-700/50 shadow-gray-900/50' 
            : 'bg-white/80 text-gray-900 border-gray-200/50 shadow-gray-500/20'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b backdrop-blur-sm rounded-t-2xl ${
          isDarkMode 
            ? 'border-gray-700/50 bg-gray-800/30' 
            : 'border-gray-200/50 bg-gray-50/30'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Theme Settings</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl hover:bg-opacity-80 transition-all duration-200 backdrop-blur-sm ${
                isDarkMode 
                  ? 'hover:bg-gray-700/50 hover:shadow-lg hover:shadow-gray-900/30' 
                  : 'hover:bg-gray-100/50 hover:shadow-lg hover:shadow-gray-500/20'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>


        {/* Content */}
        <div className="p-6">
          <h3 className="text-md font-medium mb-3">Theme</h3>
          <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto">
            {backgroundOptions.map((option) => (
              <div key={option.id}>
                <div
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 backdrop-blur-sm hover:scale-[1.02] hover:shadow-lg ${
                    currentBackground === option.id
                      ? 'border-blue-400/70 bg-blue-500/10 shadow-blue-500/20 shadow-lg'
                      : `${isDarkMode 
                          ? 'border-gray-600/50 hover:border-gray-500/70 bg-gray-800/30 hover:bg-gray-700/40 hover:shadow-gray-900/30' 
                          : 'border-gray-200/50 hover:border-gray-300/70 bg-gray-50/30 hover:bg-gray-100/40 hover:shadow-gray-500/20'
                        }`
                  }`}
                  onClick={() => {
                    setCurrentBackground(option.id);
                  }}
                >
                  {/* Preview Image */}
                  <div className="relative h-24 rounded-t-xl overflow-hidden">
                    {option.preview ? (
                      <>
                        <img
                          src={option.preview}
                          alt={option.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback if image fails to load */}
                        <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                        } hidden`}>
                          <span className="text-xs opacity-60">Preview</span>
                        </div>
                      </>
                    ) : (
                      /* CSS Background Preview */
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          backgroundColor: '#9ca3af'
                        }}
                      >
                        <div className="text-center">
                          <div className="text-lg font-medium text-gray-600 mb-1">CSS</div>
                          <div className="text-xs text-gray-500">Background</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Option Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{option.name}</h3>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                          {option.description}
                        </p>
                      </div>
                      {currentBackground === option.id && (
                        <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 ml-2 flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rain Effect Toggle for Dusk Background */}
                {option.id === 'dusk.jpg' && currentBackground === 'dusk.jpg' && (
                  <div className="mt-2 p-2 rounded-lg border border-gray-200/50 dark:border-gray-600/50 bg-gray-50/30 dark:bg-gray-800/30">
                    <button
                      onClick={toggleRain}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all duration-200 backdrop-blur-sm hover:scale-[1.01] text-xs ${
                        isDarkMode 
                          ? 'border-gray-600/50 bg-gray-700/30 hover:bg-gray-600/40 text-white' 
                          : 'border-gray-200/50 bg-white/50 hover:bg-gray-50/60 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Rain</span>
                      </div>
                      <span className={`font-medium ${isRainEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {isRainEnabled ? 'On' : 'Off'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Leaves Effect Toggle for Halloween Background */}
                {option.id === 'halloween.png' && currentBackground === 'halloween.png' && (
                  <div className="mt-2 p-2 rounded-lg border border-gray-200/50 dark:border-gray-600/50 bg-gray-50/30 dark:bg-gray-800/30">
                    <button
                      onClick={toggleLeaves}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all duration-200 backdrop-blur-sm hover:scale-[1.01] text-xs ${
                        isDarkMode 
                          ? 'border-gray-600/50 bg-gray-700/30 hover:bg-gray-600/40 text-white' 
                          : 'border-gray-200/50 bg-white/50 hover:bg-gray-50/60 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Leaves</span>
                      </div>
                      <span className={`font-medium ${isLeavesEnabled ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {isLeavesEnabled ? 'On' : 'Off'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Snow Effect Toggle for Jacobs Center Background */}
                {option.id === 'jaobscenter.jpeg' && currentBackground === 'jaobscenter.jpeg' && (
                  <div className="mt-2 p-2 rounded-lg border border-gray-200/50 dark:border-gray-600/50 bg-gray-50/30 dark:bg-gray-800/30">
                    <button
                      onClick={toggleSnow}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all duration-200 backdrop-blur-sm hover:scale-[1.01] text-xs ${
                        isDarkMode 
                          ? 'border-gray-600/50 bg-gray-700/30 hover:bg-gray-600/40 text-white' 
                          : 'border-gray-200/50 bg-white/50 hover:bg-gray-50/60 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>Snow</span>
                      </div>
                      <span className={`font-medium ${isSnowEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {isSnowEnabled ? 'On' : 'Off'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t backdrop-blur-sm rounded-b-2xl ${
          isDarkMode 
            ? 'border-gray-700/50 bg-gray-800/30' 
            : 'border-gray-200/50 bg-gray-50/30'
        }`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm hover:scale-[1.02] hover:shadow-lg ${
              isDarkMode 
                ? 'bg-gray-700/50 hover:bg-gray-600/60 text-white hover:shadow-gray-900/30' 
                : 'bg-gray-100/50 hover:bg-gray-200/60 text-gray-700 hover:shadow-gray-500/20'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelectorModal;
