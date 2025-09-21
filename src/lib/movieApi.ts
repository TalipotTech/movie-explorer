import { Movie, MovieDetails, SearchResponse } from './types';

const API_KEY = '8a4c0ad3';
const BASE_URL = 'https://www.omdbapi.com/';

export const movieApi = {
  searchMovies: async (query: string, page: number = 1): Promise<SearchResponse> => {
    if (!query.trim()) {
      return { Search: [], totalResults: '0', Response: 'False' };
    }

    try {
      const response = await fetch(
        `${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&page=${page}&type=movie`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching movies:', error);
      return { 
        Search: [], 
        totalResults: '0', 
        Response: 'False', 
        Error: 'Network error occurred' 
      };
    }
  },

  getMovieDetails: async (imdbID: string): Promise<MovieDetails | null> => {
    try {
      const response = await fetch(
        `${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.Response === 'False') {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  }
};