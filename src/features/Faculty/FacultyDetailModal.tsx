import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import FacultyStatusBars from './FacultyStatusBars';
import SetupNotesEditor from './SetupNotesEditor';
import SessionSetup from './SessionSetup';

const fetchFacultyById = async (facultyId: string) => {
  const { data, error } = await supabase
    .from('faculty')
    .select('*')
    .eq('id', Number(facultyId))
    .single();
  if (error) throw error;
  return data;
};

const FacultyDetailModal: React.FC = () => {
  const { facultyId, date } = useParams();
  const navigate = useNavigate();
  const { data: facultyMember, isLoading, error } = useQuery({
    queryKey: ['faculty', facultyId],
    queryFn: () => fetchFacultyById(facultyId!),
    enabled: !!facultyId,
  });
  
  
  // Create a mock event object for the SessionSetup component
  const mockEvent = facultyMember ? {
    instructor_names: [facultyMember.twentyfivelive_name || facultyMember.kelloggdirectory_name || 'Unknown Faculty'],
    // Add other required event properties as needed
  } as Database['public']['Tables']['events']['Row'] : null;
  
  const handlePanelModal = (panel: 'left' | 'right') => {
    // TODO: Implement panel modal functionality if needed
    console.log(`Panel modal requested for ${panel} panel`);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4"
      onClick={() => navigate(`/${date}/faculty`)}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Faculty Details</h2>
          <button
            onClick={() => navigate(`/${date}/faculty`)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="text-red-600">Error loading faculty details.</div>
        ) : facultyMember && mockEvent ? (
          <SessionSetup
            event={mockEvent}
            resources={[]}
            facultyMembers={[facultyMember]}
            instructorNames={Array.isArray(mockEvent.instructor_names)
              ? mockEvent.instructor_names.filter((name): name is string => typeof name === 'string' && name.trim() !== '')
              : []
            }
            isFacultyLoading={false}
            openPanelModal={handlePanelModal}
          />
        ) : null}
      </div>
    </div>
  );
};

export default FacultyDetailModal; 