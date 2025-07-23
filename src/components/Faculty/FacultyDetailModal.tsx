import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import FacultyStatusBars from './FacultyStatusBars';
import SetupNotesEditor from './SetupNotesEditor';

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
        ) : facultyMember ? (
          <>
            {/* Faculty Info */}
            <div className="flex flex-col items-center mb-6">
              {facultyMember.kelloggdirectory_image_url && (
                <div className="relative mb-2">
                  <img
                    src={facultyMember.kelloggdirectory_image_url}
                    alt={facultyMember.kelloggdirectory_name || 'Faculty'}
                    className="w-24 h-24 rounded-full object-cover filter grayscale opacity-80"
                  />
                  <div className="absolute inset-0 rounded-full bg-[#886ec4] mix-blend-overlay opacity-30"></div>
                </div>
              )}
              <div className="text-xl font-semibold text-center mb-1">{facultyMember.kelloggdirectory_name || facultyMember.twentyfivelive_name || 'Unknown'}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-1">{facultyMember.kelloggdirectory_title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">{facultyMember.kelloggdirectory_subtitle}</div>
              {facultyMember.kelloggdirectory_bio_url && (
                <a
                  href={facultyMember.kelloggdirectory_bio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 text-xs underline mt-1"
                >
                  View Bio
                </a>
              )}
            </div>
            {/* Status Bars */}
            <FacultyStatusBars facultyMember={facultyMember} isEditable={false} onUpdate={() => {}} />
            {/* Setup Notes */}
            <div className="mt-8">
              <SetupNotesEditor event={null as any} facultyMember={facultyMember} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default FacultyDetailModal; 