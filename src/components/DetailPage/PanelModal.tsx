import React from 'react';

interface PanelOption {
  id: string;
  label: string;
  image: string;
}

interface PanelModalProps {
  isModalOpen: boolean;
  editingPanel: 'left' | 'right' | null;
  panelOptions: PanelOption[];
  onClose: () => void;
  onSelectPanel: (imageId: string) => void;
}

export default function PanelModal({ 
  isModalOpen, 
  editingPanel, 
  panelOptions, 
  onClose, 
  onSelectPanel 
}: PanelModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select {editingPanel === 'left' ? 'Left' : 'Right'} Panel Setup
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {panelOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onSelectPanel(option.id)}
                className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <img 
                  src={option.image} 
                  alt={option.label}
                  className="w-16 h-16 object-contain mb-2"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 