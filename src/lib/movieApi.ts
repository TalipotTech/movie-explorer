import { Movie, MovieDetails, SearchResponse } from './types';

const API_KEY = '8a4c0ad3';
const BASE_URL = 'https://www.omdbapi.com/';

// Fallback URLs for better reliability
const FALLBACK_URLS = [
  'https://www.omdbapi.com/',
  'https://omdbapi.com/',
  'http://www.omdbapi.com/' // Last resort HTTP fallback
];

// Add request timeout and retry logic
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const retryFetch = async (
  endpoint: string, 
  options: RequestInit = {}, 
  maxRetries = 2
): Promise<Response> => {
  let lastError: Error;
  
  // Try each base URL
  for (const baseUrl of FALLBACK_URLS) {
    const url = `${baseUrl}${endpoint.startsWith('?') ? endpoint.slice(1) : endpoint}`;
    
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        console.log(`Attempting request to: ${url} (retry ${retry})`);
        const response = await fetchWithTimeout(url, options, 8000);
        
        if (response.ok) {
          console.log(`Success with ${baseUrl}`);
          return response;
        }
        
        // Don't retry on client errors (4xx), only server errors (5xx) and network issues
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed attempt ${retry + 1} with ${baseUrl}:`, lastError.message);
        
        // Don't retry on certain types of errors within the same base URL
        if (lastError.name === 'TypeError' && lastError.message.includes('CORS')) {
          break;
        }
        
        if (retry < maxRetries) {
          // Wait before retrying (exponential backoff with jitter)
          const delay = Math.pow(2, retry) * 500 + Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  throw lastError!;
};

export const movieApi = {
  searchMovies: async (query: string, page: number = 1): Promise<SearchResponse> => {
    if (!query.trim()) {
      return { Search: [], totalResults: '0', Response: 'False' };
    }

    try {
      const endpoint = `?apikey=${API_KEY}&s=${encodeURIComponent(query)}&page=${page}&type=movie`;
      console.log('Searching movies with query:', query);
      
      const response = await retryFetch(endpoint);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      // Handle API-specific errors
      if (data.Response === 'False') {
        return {
          Search: [],
          totalResults: '0',
          Response: 'False',
          Error: data.Error || 'No movies found'
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error searching movies:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to search movies';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout. The movie database is taking too long to respond.';
        } else if (error.message.includes('Failed to fetch') || 
                   error.message.includes('NetworkError') ||
                   error.message.includes('fetch') ||
                   error.message.includes('ERR_NETWORK') ||
                   error.message.includes('ERR_INTERNET_DISCONNECTED')) {
          errorMessage = 'Unable to connect to the movie database. Please check your internet connection.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Cross-origin request blocked. Please try again later.';
        } else if (error.message.includes('HTTP 5')) {
          errorMessage = 'Movie database is temporarily unavailable. Please try again in a few moments.';
        } else if (error.message.includes('HTTP 4')) {
          errorMessage = 'Invalid request. Please check your search terms and try again.';
        } else {
          errorMessage = `Connection failed: ${error.message}`;
        }
      }
      
      return { 
        Search: [], 
        totalResults: '0', 
        Response: 'False', 
        Error: errorMessage
      };
    }
  },

  getMovieDetails: async (imdbID: string): Promise<MovieDetails | null> => {
    try {
      const endpoint = `?apikey=${API_KEY}&i=${imdbID}&plot=full`;
      console.log('Fetching movie details for:', imdbID);
      
      const response = await retryFetch(endpoint);
      const data = await response.json();
      
      console.log('Movie details response:', data);
      
      if (data.Response === 'False') {
        console.error('Movie details error:', data.Error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  },

  // Test API connectivity with better error handling
  testConnection: async (): Promise<boolean> => {
    try {
      const endpoint = `?apikey=${API_KEY}&s=test&type=movie`;
      const response = await fetchWithTimeout(FALLBACK_URLS[0] + endpoint, {}, 5000);
      const data = await response.json();
      
      // Even if the search returns no results, if we get a proper API response, the connection works
      return response.ok && (data.Response === 'True' || data.Response === 'False');
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
};