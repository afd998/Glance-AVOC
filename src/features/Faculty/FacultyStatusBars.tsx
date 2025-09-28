import React, { useState } from 'react';
import { getEventThemeColors } from '../../utils/eventUtils';
import { Database } from '../../types/supabase';
import { Pencil } from 'lucide-react';

type Event = Database['public']['Tables']['events']['Row'];

interface FacultyStatusBarsProps {
  facultyMember: any;
  onUpdate?: (values: { timing: number; complexity: number; temperment: number }) => void;
  isEditable?: boolean;
  isUpdating?: boolean;
  updateError?: string | null;
  event?: Event | null;
}

export default function FacultyStatusBars({ 
  facultyMember, 
  onUpdate, 
  isEditable = false, 
  isUpdating = false, 
  updateError = null, 
  event = null 
}: FacultyStatusBarsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    timing: facultyMember?.timing || 0,
    complexity: facultyMember?.complexity || 0,
    temperment: facultyMember?.temperment || 0
  });

  // Get theme colors based on event type
  const themeColors = event ? getEventThemeColors(event) : null;
  const mainBg = themeColors?.[5] || 'bg-white dark:bg-gray-800';
  const cardBg = themeColors?.[3] || 'bg-gray-50 dark:bg-gray-700';

  const getGradientColor = (value: number) => {
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

  const handleValueChange = (attribute: string, value: string) => {
    setEditValues(prev => ({
      ...prev,
      [attribute]: Math.max(1, Math.min(5, parseInt(value) || 1))
    }));
  };

  if (!facultyMember || (!facultyMember.timing && !facultyMember.complexity && !facultyMember.temperment)) {
    return null;
  }

  return (
    <div className={`${mainBg} rounded-lg shadow-sm p-3 border w-fit`}>
             <div className="flex items-center justify-between mb-2">
         <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Attributes</h3>
         {isEditable && (
           <div className="flex gap-1">
            {!isEditing ? (
                             <button
                 onClick={() => setIsEditing(true)}
                 className="p-1 text-purple-400 hover:text-purple-500 hover:underline transition-colors duration-200"
                 disabled={isUpdating}
                 title="Edit attributes"
               >
                 <Pencil className="w-3.5 h-3.5" />
               </button>
            ) : (
              <>
                                 <button
                   onClick={handleSave}
                   className="text-xs px-1.5 py-0.5 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors disabled:opacity-50"
                   disabled={isUpdating}
                 >
                   {isUpdating ? 'Saving...' : 'Save'}
                 </button>
                 <button
                   onClick={handleCancel}
                   className="text-xs px-1.5 py-0.5 bg-purple-400 hover:bg-purple-500 text-white rounded transition-colors disabled:opacity-50"
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
        <div className="mb-2 p-1.5 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-xs">
          Error saving changes: {updateError}
        </div>
      )}
      
      <div className="space-y-1">
        {facultyMember.timing && (
          <div>
            <div className="mb-0.5">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Punctuality</div>
              <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Early</span>
                <span>Late</span>
              </div>
            </div>
            <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 rounded-full"
                style={{ 
                  width: `${((isEditing ? editValues.timing : facultyMember.timing) / 5) * 100}%`,
                  backgroundColor: getGradientColor(isEditing ? editValues.timing : facultyMember.timing)
                }}
              ></div>
            </div>
            {isEditing && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">1</span>
                                 <input
                   type="range"
                   min="1"
                   max="5"
                   value={editValues.timing}
                   onChange={(e) => handleValueChange('timing', e.target.value)}
                   className="flex-1 mx-2 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-gray-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-gray-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
                   style={{
                     background: `linear-gradient(to right, ${getGradientColor(editValues.timing)} 0%, ${getGradientColor(editValues.timing)} ${(editValues.timing / 5) * 100}%, #e5e7eb ${(editValues.timing / 5) * 100}%, #e5e7eb 100%)`
                   }}
                   disabled={isUpdating}
                 />
                <span className="text-xs text-gray-500">5</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 text-center">
                  {editValues.timing}
                </span>
              </div>
            )}
          </div>
        )}
        {facultyMember.complexity && (
          <div>
            <div className="mb-0.5">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Setup Difficulty</div>
              <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Easy</span>
                <span>Complicated</span>
              </div>
            </div>
            <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 rounded-full"
                style={{ 
                  width: `${((isEditing ? editValues.complexity : facultyMember.complexity) / 5) * 100}%`,
                  backgroundColor: getGradientColor(isEditing ? editValues.complexity : facultyMember.complexity)
                }}
              ></div>
            </div>
            {isEditing && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">1</span>
                                 <input
                   type="range"
                   min="1"
                   max="5"
                   value={editValues.complexity}
                   onChange={(e) => handleValueChange('complexity', e.target.value)}
                   className="flex-1 mx-2 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-gray-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-gray-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
                   style={{
                     background: `linear-gradient(to right, ${getGradientColor(editValues.complexity)} 0%, ${getGradientColor(editValues.complexity)} ${(editValues.complexity / 5) * 100}%, #e5e7eb ${(editValues.complexity / 5) * 100}%, #e5e7eb 100%)`
                   }}
                   disabled={isUpdating}
                 />
                <span className="text-xs text-gray-500">5</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 text-center">
                  {editValues.complexity}
                </span>
              </div>
            )}
          </div>
        )}
        {facultyMember.temperment && (
          <div>
            <div className="mb-0.5">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Temperment</div>
              <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Calm</span>
                <span>Reactive</span>
              </div>
            </div>
            <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 rounded-full"
                style={{ 
                  width: `${((isEditing ? editValues.temperment : facultyMember.temperment) / 5) * 100}%`,
                  backgroundColor: getGradientColor(isEditing ? editValues.temperment : facultyMember.temperment)
                }}
              ></div>
            </div>
            {isEditing && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">1</span>
                                 <input
                   type="range"
                   min="1"
                   max="5"
                   value={editValues.temperment}
                   onChange={(e) => handleValueChange('temperment', e.target.value)}
                   className="flex-1 mx-2 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-gray-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-gray-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
                   style={{
                     background: `linear-gradient(to right, ${getGradientColor(editValues.temperment)} 0%, ${getGradientColor(editValues.temperment)} ${(editValues.temperment / 5) * 100}%, #e5e7eb ${(editValues.temperment / 5) * 100}%, #e5e7eb 100%)`
                   }}
                   disabled={isUpdating}
                 />
                <span className="text-xs text-gray-500">5</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 text-center">
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