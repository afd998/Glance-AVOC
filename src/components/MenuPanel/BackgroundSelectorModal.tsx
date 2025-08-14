import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface BackgroundSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackground: string;
  onBackgroundChange: (background: string) => void;
}

const BackgroundSelectorModal: React.FC<BackgroundSelectorModalProps> = ({
  isOpen,
  onClose,
  currentBackground,
  onBackgroundChange
}) => {
  const { isDarkMode } = useTheme();

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
      id: 'Vista.avif',
      name: 'Vista',
      preview: '/Vista.avif',
      description: 'Vista background'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div 
        className={`w-full max-w-md rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Choose Background</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-opacity-80 transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {backgroundOptions.map((option) => (
              <div
                key={option.id}
                className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                  currentBackground === option.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : `${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'}`
                }`}
                onClick={() => {
                  onBackgroundChange(option.id);
                  onClose();
                }}
              >
                                 {/* Preview Image */}
                 <div className="relative h-32 rounded-t-lg overflow-hidden">
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
                   <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} hidden`}>
                     <span className="text-sm opacity-60">Preview</span>
                   </div>
                 </div>
                
                {/* Option Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{option.name}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {option.description}
                      </p>
                    </div>
                    {currentBackground === option.id && (
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelectorModal;
