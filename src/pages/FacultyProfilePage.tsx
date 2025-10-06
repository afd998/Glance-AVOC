import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import FacultyStatusBars from '../core/faculty/FacultyStatusBars';
import SetupNotesEditor from '../core/faculty/SetupNotesEditor';
import SessionSetup from '../core/faculty/FacultyProfile';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useHeader } from '../contexts/HeaderContext';

const fetchFacultyById = async (facultyId: string) => {
  const { data, error } = await supabase
    .from('faculty')
    .select('*')
    .eq('id', Number(facultyId))
    .single();
  if (error) throw error;
  return data;
};

const FacultyProfilePage: React.FC = () => {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  const { setHeaderContent } = useHeader();
  const { data: facultyMember, isLoading, error } = useQuery({
    queryKey: ['faculty', facultyId],
    queryFn: () => fetchFacultyById(facultyId!),
    enabled: !!facultyId,
  });

  // Set header content when faculty data is loaded
  useEffect(() => {
    if (facultyMember) {
      const facultyName = facultyMember.kelloggdirectory_name || facultyMember.twentyfivelive_name || `Faculty ${facultyId}`;
      setHeaderContent(
        <h1 className="text-lg font-semibold text-foreground">
          <span>
            <button 
              onClick={() => navigate('/faculty')}
              className="text-primary hover:text-primary/80 underline cursor-pointer"
            >
              Faculty List
            </button>
            {' > '}
            {facultyName}
          </span>
        </h1>
      );
    } else {
      setHeaderContent(null);
    }

    // Cleanup when component unmounts
    return () => setHeaderContent(null);
  }, [facultyMember, facultyId, navigate, setHeaderContent]);
  
  
  // Create a mock event object for the SessionSetup component
  const mockEvent = facultyMember ? {
    instructor_names: [facultyMember.twentyfivelive_name || facultyMember.kelloggdirectory_name || 'Unknown Faculty'],
    // Add other required event properties as needed
  } as Database['public']['Tables']['events']['Row'] : null;
  
  // Panel modal logic moved down into SessionSetups to avoid prop drilling

  return (
    <div className="min-h-screen bg-background">
      
      {/* Content */}
      <div className="p-6">
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
          />
        ) : null}
      </div>
    </div>
  );
};

export default FacultyProfilePage; 