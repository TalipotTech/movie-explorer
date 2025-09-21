import { Movie, MovieDetails, SearchResponse } from './types';

const API_KEY = '8a4c0ad3';
const BASE_URL = 'https://www.omdbapi.com/';

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

const retryFetch = async (url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetchWithTimeout(url, options, i === 0 ? 10000 : 15000);
      if (response.ok) {
        return response;
      }
      
      // Don't retry on client errors (4xx), only server errors (5xx) and network issues
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain types of errors
      if (lastError.name === 'TypeError' && lastError.message.includes('CORS')) {
        break;
      }
      
      if (i === maxRetries) break;
      
      // Wait before retrying (exponential backoff with jitter)
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
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
      const url = `${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&page=${page}&type=movie`;
      console.log('Fetching movies from:', url);
      
      const response = await retryFetch(url);
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
          errorMessage = 'Connection timeout. Please check your internet connection and try again.';
        } else if (error.message.includes('Failed to fetch') || 
                   error.message.includes('NetworkError') ||
                   error.message.includes('fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Unable to access movie database. Please try again later.';
        } else if (error.message.includes('HTTP 5')) {
          errorMessage = 'Movie database is temporarily unavailable. Please try again later.';
        } else if (error.message.includes('HTTP 4')) {
          errorMessage = 'Invalid request. Please check your search terms.';
        } else {
          errorMessage = error.message;
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
      const url = `${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`;
      console.log('Fetching movie details from:', url);
      
      const response = await retryFetch(url);
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

  // Test API connectivity
  testConnection: async (): Promise<boolean> => {
    try {
      const url = `${BASE_URL}?apikey=${API_KEY}&s=test&type=movie`;
      const response = await fetchWithTimeout(url, {}, 5000);
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
};