import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';

// Cache for faculty data
let facultyCache = null;

export const fetchFacultyDirectory = async () => {
  try {
    // Always fetch fresh data from API
    const response = await fetch('http://localhost:3003/api/faculty');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const faculty = await response.json();
    
    // Update cache with fresh data
    facultyCache = faculty;
    localStorage.setItem('faculty-directory-cache', JSON.stringify({
      state: { data: faculty },
      timestamp: Date.now()
    }));
    
    return faculty;
  } catch (error) {
    // Only use cache if API fetch fails
    const cachedData = localStorage.getItem('faculty-directory-cache');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed && parsed.state && parsed.state.data) {
          return parsed.state.data;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  }
};

// Create a Fuse instance for fuzzy name matching
let fuseInstance = null;

const getFuseInstance = (faculty) => {
  if (!fuseInstance) {
    fuseInstance = new Fuse(faculty, {
      keys: ['name'],
      threshold: 0.6,
      includeScore: true,
      tokenize: true,
      matchAllTokens: true,
      location: 0,
      distance: 100,
      minMatchCharLength: 2
    });
  }
  return fuseInstance;
};

export function findFacultyMember(name, faculty) {
  if (!name || !faculty || faculty.length === 0) {
    return null;
  }

  // Try exact match first
  const exactMatch = faculty.find(member => member.name === name);
  if (exactMatch) {
    return exactMatch;
  }

  // Try case-insensitive match
  const caseInsensitiveMatch = faculty.find(member => 
    member.name.toLowerCase() === name.toLowerCase()
  );
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch;
  }

  // Try matching with reversed name format (Last, First -> First Last)
  if (name.includes(',')) {
    const [lastName, firstName] = name.split(',').map(n => n.trim());
    const reversedName = `${firstName} ${lastName}`;
    
    const reversedMatch = faculty.find(member => 
      member.name.toLowerCase() === reversedName.toLowerCase()
    );
    if (reversedMatch) {
      return reversedMatch;
    }
  }

  // Try partial match
  const partialMatch = faculty.find(member => {
    const memberNameLower = member.name.toLowerCase();
    const searchNameLower = name.toLowerCase();
    
    // Try both original and reversed name for partial matching
    let isMatch = memberNameLower.includes(searchNameLower) || searchNameLower.includes(memberNameLower);
    
    if (name.includes(',')) {
      const [lastName, firstName] = name.split(',').map(n => n.trim().toLowerCase());
      const reversedNameLower = `${firstName} ${lastName}`;
      isMatch = isMatch || memberNameLower.includes(reversedNameLower) || reversedNameLower.includes(memberNameLower);
    }
    
    return isMatch;
  });

  if (partialMatch) {
    return partialMatch;
  }

  // If no match found with direct methods, try Fuse.js
  const fuse = getFuseInstance(faculty);
  const fuseResults = fuse.search(name);
  if (fuseResults.length > 0) {
    return fuseResults[0].item;
  }

  return null;
}

// React Query hook for faculty data
export const useFacultyDirectory = () => {
  return useQuery({
    queryKey: ['facultyDirectory'],
    queryFn: fetchFacultyDirectory,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Changed to true to refresh on focus
    refetchOnReconnect: true,
    retry: 3
  });
}; 