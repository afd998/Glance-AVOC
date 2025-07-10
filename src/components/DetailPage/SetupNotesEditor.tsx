import React, { useState, useEffect } from 'react';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface SetupNotesEditorProps {
  event: Event;
  facultyMember: FacultyMember | null | undefined;
  updateFacultyAttributes: any; // Type this properly when the hook is converted
}

export default function SetupNotesEditor({ event, facultyMember, updateFacultyAttributes }: SetupNotesEditorProps) {
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing notes when faculty member data changes
  useEffect(() => {
    if (facultyMember?.setup_notes) {
      setNotes(facultyMember.setup_notes);
    } else {
      setNotes('');
    }
  }, [facultyMember?.setup_notes]);

  const handleSave = async () => {
    if (!facultyMember) return;
    
    setIsSaving(true);
    try {
      await updateFacultyAttributes.mutateAsync({
        twentyfiveliveName: event.instructor_name || '',
        attributes: {
          ...facultyMember,
          setup_notes: notes
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving setup notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original notes
    if (facultyMember?.setup_notes) {
      setNotes(facultyMember.setup_notes);
    } else {
      setNotes('');
    }
    setIsEditing(false);
  };

  if (!facultyMember) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Setup Notes</h3>
        <p className="text-gray-500 dark:text-gray-400">No faculty member assigned to this session.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Setup Notes</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit Notes
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter setup notes for this session..."
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-[6rem] p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          {notes ? (
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No setup notes available.</p>
          )}
        </div>
      )}
    </div>
  );
} 