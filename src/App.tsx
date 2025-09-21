import { useState, useEffect } from 'react';
import { Movie, type MovieFilters } from '@/lib/types';
import { movieApi } from '@/lib/movieApi';
import { smartMovieFilter } from '@/lib/movieFilter';
import { SearchBar } from '@/components/SearchBar';
import { MovieGrid } from '@/components/MovieGrid';
import { MovieDetailsView } from '@/components/MovieDetailsView';
import { MovieFilters as MovieFiltersComponent } from '@/components/MovieFilters';
import { FilterProgress } from '@/components/FilterProgress';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Card } from '@/components/ui/card';
import { FilmStrip, MagnifyingGlass, Warning } from '@phosphor-icons/react';

function App() {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterProgress, setFilterProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const [currentFilters, setCurrentFilters] = useState<MovieFilters>({
    genre: '',
    yearRange: { min: 1900, max: new Date().getFullYear() },
    minRating: 0
  });

  const handleSearch = async (query: string) => {
    if (!query) {
      setAllMovies([]);
      setFilteredMovies([]);
      setHasSearched(false);
      setError(null);
      setShowConnectionStatus(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setLastSearchQuery(query);
    setShowConnectionStatus(false);

    try {
      const result = await movieApi.searchMovies(query);
      
      if (result.Response === 'True' && result.Search) {
        setAllMovies(result.Search);
        // Apply current filters to new search results
        await applyFilters(result.Search, currentFilters);
        setShowConnectionStatus(false);
      } else {
        setAllMovies([]);
        setFilteredMovies([]);
        setError(result.Error || 'No movies found');
        
        // Show connection status if it looks like a network error
        if (result.Error && (
          result.Error.includes('Network') ||
          result.Error.includes('connection') ||
          result.Error.includes('timeout') ||
          result.Error.includes('Failed to fetch')
        )) {
          setShowConnectionStatus(true);
        }
      }
    } catch (err) {
      const errorMessage = 'Failed to search movies. Please check your connection and try again.';
      setError(errorMessage);
      setAllMovies([]);
      setFilteredMovies([]);
      setShowConnectionStatus(true);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async (movies: Movie[], filters: MovieFilters) => {
    if (!movies.length) {
      setFilteredMovies([]);
      return;
    }

    // Check if any advanced filters are applied
    const hasAdvancedFilters = filters.genre || filters.minRating > 0;
    
    if (!hasAdvancedFilters) {
      // Only apply basic year filter
      const yearFiltered = movies.filter(movie => {
        const year = parseInt(movie.Year.split('-')[0]);
        return year >= filters.yearRange.min && year <= filters.yearRange.max;
      });
      setFilteredMovies(yearFiltered);
      return;
    }

    // Apply advanced filters with progress tracking
    setIsFiltering(true);
    setFilterProgress({ current: 0, total: movies.length });

    try {
      const filtered = await smartMovieFilter.filterMovies(
        movies,
        filters,
        (current, total) => {
          setFilterProgress({ current, total });
        }
      );
      setFilteredMovies(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredMovies(movies); // Fallback to unfiltered results
    } finally {
      setIsFiltering(false);
    }
  };

  const handleRetrySearch = () => {
    if (lastSearchQuery) {
      handleSearch(lastSearchQuery);
    }
  };

  const handleFiltersChange = async (filters: MovieFilters) => {
    setCurrentFilters(filters);
    if (allMovies.length > 0) {
      await applyFilters(allMovies, filters);
    }
  };

  // Apply filters when movies or filters change
  useEffect(() => {
    if (allMovies.length > 0) {
      applyFilters(allMovies, currentFilters);
    }
  }, []); // Only run on mount, manual calls handle updates

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovieId(movie.imdbID);
  };

  const handleBackToSearch = () => {
    setSelectedMovieId(null);
  };

  if (selectedMovieId) {
    return (
      <MovieDetailsView
        imdbID={selectedMovieId}
        onBack={handleBackToSearch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FilmStrip className="w-8 h-8 text-accent" />
            <h1 className="text-4xl font-bold">MovieFlix</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover and explore movies from around the world
          </p>
        </header>

        <div className="mb-8">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        <ConnectionStatus
          isVisible={showConnectionStatus}
          onRetry={handleRetrySearch}
        />

        <MovieFiltersComponent
          onFiltersChange={handleFiltersChange}
          isVisible={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        <FilterProgress
          current={filterProgress.current}
          total={filterProgress.total}
          isVisible={isFiltering}
        />

        {!hasSearched && !isLoading && (
          <Card className="p-12 text-center bg-card/50">
            <MagnifyingGlass className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Search for Movies</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a movie title above to start discovering films, view ratings, and explore detailed information.
            </p>
          </Card>
        )}

        {error && hasSearched && !isLoading && (
          <Card className="p-8 text-center border-destructive/20 bg-destructive/5 mb-6">
            <Warning className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold text-destructive mb-2">Search Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </Card>
        )}

        {hasSearched && filteredMovies.length === 0 && !error && !isLoading && !isFiltering && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No movies found matching your criteria. Try adjusting your filters or search terms.
            </p>
          </Card>
        )}

        <MovieGrid
          movies={filteredMovies}
          onMovieClick={handleMovieClick}
          isLoading={isLoading || isFiltering}
        />
      </div>
    </div>
  );
}

export default App;