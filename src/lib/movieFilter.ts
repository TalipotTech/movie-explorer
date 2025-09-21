import { type Movie, type MovieDetails, type MovieFilters } from './types';
import { movieApi } from './movieApi';

/**
 * Utility functions for filtering movies based on user criteria
 */

/**
 * Parse IMDB rating from movie details
 */
const parseRating = (rating: string): number => {
  const parsed = parseFloat(rating);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parse year from movie year string (handles ranges like "2020-2022")
 */
const parseYear = (yearString: string): number => {
  const year = parseInt(yearString.split('-')[0]);
  return isNaN(year) ? 0 : year;
};

/**
 * Check if a movie matches the genre filter
 */
const matchesGenre = (movieGenres: string, filterGenre: string): boolean => {
  if (!filterGenre) return true;
  return movieGenres.toLowerCase().includes(filterGenre.toLowerCase());
};

/**
 * Check if a movie year falls within the specified range
 */
const matchesYearRange = (movieYear: string, yearRange: { min: number; max: number }): boolean => {
  const year = parseYear(movieYear);
  return year >= yearRange.min && year <= yearRange.max;
};

/**
 * Check if a movie rating meets the minimum requirement
 */
const matchesRating = (movieRating: string, minRating: number): boolean => {
  if (minRating === 0) return true;
  const rating = parseRating(movieRating);
  return rating >= minRating;
};

/**
 * Filter movies based on basic criteria (without requiring additional API calls)
 */
export const filterMoviesBasic = (movies: Movie[], filters: MovieFilters): Movie[] => {
  return movies.filter(movie => {
    // Year filter (available in basic movie data)
    if (!matchesYearRange(movie.Year, filters.yearRange)) {
      return false;
    }
    
    return true;
  });
};

/**
 * Enhanced filtering that fetches additional movie details for accurate filtering
 * This is more accurate but requires additional API calls
 */
export const filterMoviesDetailed = async (
  movies: Movie[], 
  filters: MovieFilters,
  onProgress?: (current: number, total: number) => void
): Promise<Movie[]> => {
  // First apply basic filters to reduce API calls
  const basicFiltered = filterMoviesBasic(movies, filters);
  
  // If no genre or rating filters, return basic filtered results
  if (!filters.genre && filters.minRating === 0) {
    return basicFiltered;
  }
  
  const detailedResults: Movie[] = [];
  
  // Fetch details for each movie to apply advanced filters
  for (let i = 0; i < basicFiltered.length; i++) {
    const movie = basicFiltered[i];
    
    try {
      const details = await movieApi.getMovieDetails(movie.imdbID);
      
      if (details) {
        // Apply genre filter
        if (filters.genre && !matchesGenre(details.Genre, filters.genre)) {
          continue;
        }
        
        // Apply rating filter
        if (!matchesRating(details.imdbRating, filters.minRating)) {
          continue;
        }
        
        detailedResults.push(movie);
      }
    } catch (error) {
      console.error(`Error fetching details for movie ${movie.imdbID}:`, error);
      // Include movie in results if we can't fetch details (graceful degradation)
      detailedResults.push(movie);
    }
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, basicFiltered.length);
    }
  }
  
  return detailedResults;
};

/**
 * Smart filtering that balances accuracy with performance
 * Uses caching and batching to optimize API calls
 */
export class SmartMovieFilter {
  private detailsCache = new Map<string, MovieDetails>();
  private fetchingPromises = new Map<string, Promise<MovieDetails | null>>();
  
  /**
   * Get movie details with caching
   */
  private async getMovieDetailsWithCache(imdbID: string): Promise<MovieDetails | null> {
    // Return cached result if available
    if (this.detailsCache.has(imdbID)) {
      return this.detailsCache.get(imdbID) || null;
    }
    
    // Return existing promise if already fetching
    if (this.fetchingPromises.has(imdbID)) {
      return this.fetchingPromises.get(imdbID) || null;
    }
    
    // Start new fetch
    const promise = movieApi.getMovieDetails(imdbID);
    this.fetchingPromises.set(imdbID, promise);
    
    try {
      const details = await promise;
      if (details) {
        this.detailsCache.set(imdbID, details);
      }
      return details;
    } finally {
      this.fetchingPromises.delete(imdbID);
    }
  }
  
  /**
   * Filter movies with smart caching and progress reporting
   */
  async filterMovies(
    movies: Movie[], 
    filters: MovieFilters,
    onProgress?: (current: number, total: number) => void
  ): Promise<Movie[]> {
    // Apply basic filters first
    const basicFiltered = filterMoviesBasic(movies, filters);
    
    // If no advanced filters needed, return basic results
    if (!filters.genre && filters.minRating === 0) {
      return basicFiltered;
    }
    
    const results: Movie[] = [];
    const total = basicFiltered.length;
    
    // Process movies in small batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < basicFiltered.length; i += batchSize) {
      const batch = basicFiltered.slice(i, i + batchSize);
      
      // Fetch details for batch
      const detailsPromises = batch.map(movie => 
        this.getMovieDetailsWithCache(movie.imdbID)
      );
      
      const batchDetails = await Promise.all(detailsPromises);
      
      // Filter based on details
      for (let j = 0; j < batch.length; j++) {
        const movie = batch[j];
        const details = batchDetails[j];
        
        if (details) {
          // Apply genre filter
          if (filters.genre && !matchesGenre(details.Genre, filters.genre)) {
            continue;
          }
          
          // Apply rating filter
          if (!matchesRating(details.imdbRating, filters.minRating)) {
            continue;
          }
        }
        
        results.push(movie);
      }
      
      // Report progress
      if (onProgress) {
        onProgress(Math.min(i + batchSize, total), total);
      }
    }
    
    return results;
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.detailsCache.clear();
    this.fetchingPromises.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.detailsCache.size,
      hitRate: this.detailsCache.size > 0 ? this.detailsCache.size / (this.detailsCache.size + this.fetchingPromises.size) : 0
    };
  }
}

// Export a singleton instance for use across the app
export const smartMovieFilter = new SmartMovieFilter();