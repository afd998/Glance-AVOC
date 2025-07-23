import React, { useState } from 'react';

export default function FacultyStatusBars({ facultyMember, onUpdate, isEditable = false, isUpdating = false, updateError = null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    timing: facultyMember?.timing || 0,
    complexity: facultyMember?.complexity || 0,
    temperment: facultyMember?.temperment || 0
  });

  const getGradientColor = (value) => {
    const percentage = (value / 5) * 100;
    if (percentage <= 20) {
      return '#10b981'; // green-500
    } else if (percentage <= 40) {
      return '#84cc16'; // lime-500
    } else if (percentage <= 60) {
      return '#eab308'; // yellow-500
    } else if (percentage <= 80) {
      return '#f97316'; // orange-500
    } else {
      return '#ef4444'; // red-500
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editValues);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      timing: facultyMember?.timing || 0,
      complexity: facultyMember?.complexity || 0,
      temperment: facultyMember?.temperment || 0
    });
    setIsEditing(false);
  };

  const handleValueChange = (attribute, value) => {
    setEditValues(prev => ({
      ...prev,
      [attribute]: Math.max(1, Math.min(5, parseInt(value) || 1))
    }));
  };

  if (!facultyMember || (!facultyMember.timing && !facultyMember.complexity && !facultyMember.temperment)) {
    return null;
  }

  return (
    <div>
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          background: var(--slider-color) !important;
          border: 2px solid var(--slider-color) !important;
        }
        input[type="range"]::-webkit-slider-track {
          background: var(--slider-bg) !important;
        }
        input[type="range"]::-moz-range-thumb {
          background: var(--slider-color) !important;
          border: 2px solid var(--slider-color) !important;
        }
        input[type="range"]::-moz-range-track {
          background: var(--slider-bg) !important;
        }
        input[type="range"]::-ms-thumb {
          background: var(--slider-color) !important;
          border: 2px solid var(--slider-color) !important;
        }
        input[type="range"]::-ms-track {
          background: var(--slider-bg) !important;
        }
      `}</style>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attributes</h3>
        {isEditable && (
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                disabled={isUpdating}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {updateError && (
        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
          Error saving changes: {updateError}
        </div>
      )}
      
      <div className="space-y-4">
        {facultyMember.timing && (
          <div>
            <div className="mb-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Punctuality</div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Early</span>
                <span>Late</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 rounded-full"
                style={{ 
                  width: `${((isEditing ? editValues.timing : facultyMember.timing) / 5) * 100}%`,
                  backgroundColor: getGradientColor(isEditing ? editValues.timing : facultyMember.timing)
                }}
              ></div>
            </div>
            {isEditing && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">1</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={editValues.timing}
                  onChange={(e) => handleValueChange('timing', e.target.value)}
                  className="flex-1 mx-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-track]:h-2 [&::-webkit-slider-track]:rounded-full [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full"
                  style={{
                    '--slider-color': getGradientColor(editValues.timing),
                    '--slider-bg': '#e5e7eb'
                  }}
                  disabled={isUpdating}
                />
                <span className="text-xs text-gray-500">5</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                  {editValues.timing}
                </span>
              </div>
            )}
          </div>
        )}
        {facultyMember.complexity && (
          <div>
            <div className="mb-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setup Difficulty</div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Easy</span>
                <span>Complicated</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 rounded-full"
                style={{ 
                  width: `${((isEditing ? editValues.complexity : facultyMember.complexity) / 5) * 100}%`,
                  backgroundColor: getGradientColor(isEditing ? editValues.complexity : facultyMember.complexity)
                }}
              ></div>
            </div>
            {isEditing && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">1</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={editValues.complexity}
                  onChange={(e) => handleValueChange('complexity', e.target.value)}
                  className="flex-1 mx-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-track]:h-2 [&::-webkit-slider-track]:rounded-full [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full"
                  style={{
                    '--slider-color': getGradientColor(editValues.complexity),
                    '--slider-bg': '#e5e7eb'
                  }}
                  disabled={isUpdating}
                />
                <span className="text-xs text-gray-500">5</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                  {editValues.complexity}
                </span>
              </div>
            )}
          </div>
        )}
        {facultyMember.temperment && (
          <div>
            <div className="mb-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperment</div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Calm</span>
                <span>Reactive</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 rounded-full"
                style={{ 
                  width: `${((isEditing ? editValues.temperment : facultyMember.temperment) / 5) * 100}%`,
                  backgroundColor: getGradientColor(isEditing ? editValues.temperment : facultyMember.temperment)
                }}
              ></div>
            </div>
            {isEditing && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">1</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={editValues.temperment}
                  onChange={(e) => handleValueChange('temperment', e.target.value)}
                  className="flex-1 mx-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-track]:h-2 [&::-webkit-slider-track]:rounded-full [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full"
                  style={{
                    '--slider-color': getGradientColor(editValues.temperment),
                    '--slider-bg': '#e5e7eb'
                  }}
                  disabled={isUpdating}
                />
                <span className="text-xs text-gray-500">5</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
                  {editValues.temperment}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 