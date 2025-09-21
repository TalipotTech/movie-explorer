import { useState } from 'react';
import { Movie } from '@/lib/types';
import { movieApi } from '@/lib/movieApi';
import { SearchBar } from '@/components/SearchBar';
import { MovieGrid } from '@/components/MovieGrid';
import { MovieDetailsView } from '@/components/MovieDetailsView';
import { Card } from '@/components/ui/card';
import { FilmStrip, MagnifyingGlass } from '@phosphor-icons/react';

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query) {
      setMovies([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await movieApi.searchMovies(query);
      
      if (result.Response === 'True' && result.Search) {
        setMovies(result.Search);
      } else {
        setMovies([]);
        setError(result.Error || 'No movies found');
      }
    } catch (err) {
      setError('Failed to search movies. Please try again.');
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
          </Card>
        )}

        {hasSearched && movies.length === 0 && !error && !isLoading && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No movies found. Try searching with different keywords.
            </p>
          </Card>
        )}

        <MovieGrid
          movies={movies}
          onMovieClick={handleMovieClick}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;