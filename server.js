const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

// Proxy endpoint for faculty directory
app.get('/api/faculty', async (req, res) => {
  try {
    // First, get the first page to determine total results
    const firstPageResponse = await axios.get('https://www.kellogg.northwestern.edu/api/facultylisting', {
      params: {
        listingId: 'e9eb7e22-b0ce-4907-be8b-9e73c3347c55',
        pageId: 'ec51f47e-4843-4eb7-a5d5-15ec09593247',
        page: 1
      }
    });
    
    const totalResults = firstPageResponse.data.totalResults;
    const perPage = firstPageResponse.data.results.length;
    const totalPages = Math.ceil(totalResults / perPage);
    
    // Fetch all pages in parallel
    const pagePromises = [];
    for (let page = 1; page <= totalPages; page++) {
      pagePromises.push(
        axios.get('https://www.kellogg.northwestern.edu/api/facultylisting', {
          params: {
            listingId: 'e9eb7e22-b0ce-4907-be8b-9e73c3347c55',
            pageId: 'ec51f47e-4843-4eb7-a5d5-15ec09593247',
            page
          }
        })
      );
    }
    
    const pageResponses = await Promise.all(pagePromises);
    
    // Combine all results
    const allFaculty = pageResponses.flatMap(response => response.data.results);
    
    // Transform the data to match our expected format
    const faculty = allFaculty.map(member => ({
      name: member.name,
      title: member.title,
      imageUrl: member.images?.desktop1X ? new URL(member.images.desktop1X, 'https://www.kellogg.northwestern.edu').toString() : null,
      department: member.title.split(' of ')[1] || null, // Extract department from title
      bioUrl: member.url ? new URL(member.url, 'https://www.kellogg.northwestern.edu').toString() : null // Use the URL directly since it's already a full URL
    }));
    
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch faculty directory' });
  }
});

// Proxy endpoint for events
app.get('/api/events', async (req, res) => {
  try {
    const response = await axios.get('https://www.kellogg.northwestern.edu/api/events');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`[Proxy] Server running on port ${PORT}`);
}); 