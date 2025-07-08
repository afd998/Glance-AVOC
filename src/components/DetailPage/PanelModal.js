import React from 'react';

export default function PanelModal({ 
  isModalOpen, 
  editingPanel, 
  panelOptions, 
  onClose, 
  onSelectPanel 
}) {
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
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <div className="h-24 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700 flex items-center justify-center mb-3">
                  <img 
                    src={option.image}
                    alt={option.label}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('Error loading modal image:', option.image);
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="text-gray-500 text-sm">Failed to load</span>`;
                    }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
                  {option.label}
                </p>
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
