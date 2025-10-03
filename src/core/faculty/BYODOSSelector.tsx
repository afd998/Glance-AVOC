import React from 'react';

interface BYODOSSelectorProps {
  currentOS: string | null;
  isEditMode: boolean;
  onOSChange: (os: string) => void;
  isUpdating: boolean;
  themeColors: any;
  themeHexColors: any;
}

const OS_OPTIONS = [
  { value: 'MAC', label: 'Mac', icon: '🍎' },
  { value: 'PC', label: 'PC', icon: '🖥️' },
  { value: 'LINUX', label: 'Linux', icon: '🐧' }
];

export default function BYODOSSelector({
  currentOS,
  isEditMode,
  onOSChange,
  isUpdating,
  themeColors,
  themeHexColors
}: BYODOSSelectorProps) {
  if (!isEditMode) {
    // Display mode - show current selection
    const selectedOS = OS_OPTIONS.find(os => os.value === currentOS);
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative m-0 p-0">
            <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-200 rounded-full"></div>
            <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl">
              {selectedOS?.icon || '💻'}
            </div>
          </div>
          <span className="text-sm sm:text-base text-black font-medium">BYOD OS</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-black font-medium">
            {selectedOS?.label || 'Not set'}
          </span>
        </div>
      </div>
    );
  }

  // Edit mode - show toggle buttons
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="relative m-0 p-0">
          <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-200 rounded-full"></div>
          <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl">
            💻
          </div>
        </div>
        <span className="text-sm sm:text-base text-black font-medium">BYOD OS</span>
      </div>
      <div className="flex gap-1">
        {OS_OPTIONS.map((os) => (
          <button
            key={os.value}
            onClick={() => onOSChange(os.value)}
            disabled={isUpdating}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors
              ${currentOS === os.value
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white/20 border-white/20 text-black hover:bg-white/30'
              }
              ${isUpdating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={`Select ${os.label}`}
          >
            <span>{os.icon}</span>
            <span>{os.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
