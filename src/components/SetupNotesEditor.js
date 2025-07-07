import React, { useState } from 'react';

export default function SetupNotesEditor({
  value = '',
  onSave,
  isSaving = false,
  error = null,
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(value || '');
  const [touched, setTouched] = useState(false);

  // If value changes from parent, update local state (e.g., after save)
  React.useEffect(() => {
    if (!editing) setNotes(value || '');
  }, [value, editing]);

  const handleEdit = () => {
    setEditing(true);
    setTouched(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setNotes(value || '');
    setTouched(false);
  };

  const handleSave = () => {
    if (notes !== value && onSave) {
      onSave(notes);
    }
    setEditing(false);
    setTouched(false);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor="setup-notes" className="block text-gray-700 dark:text-gray-300 font-medium">Setup Notes</label>
        {!editing && (
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium px-0 py-0 bg-transparent border-none shadow-none focus:outline-none"
            onClick={handleEdit}
          >
            Edit
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {!editing ? (
          <div className="min-h-[60px] w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-100 whitespace-pre-line">
            {value && value.trim() !== '' ? value : <span className="text-gray-400 italic">No notes yet.</span>}
          </div>
        ) : (
          <textarea
            id="setup-notes"
            className="w-full min-h-[60px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
            value={notes}
            onChange={e => { setNotes(e.target.value); setTouched(true); }}
            disabled={isSaving}
            placeholder="Add notes about this instructor's typical setup..."
          />
        )}
        {editing && (
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-60"
              onClick={handleSave}
              disabled={isSaving || notes === value || !touched}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500 dark:text-red-400 mt-1">Error: {error}</div>
        )}
      </div>
    </div>
  );
} 