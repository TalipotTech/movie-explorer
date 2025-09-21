import { useEffect, useState } from 'react';
import { MovieDetails } from '@/lib/types';
import { movieApi } from '@/lib/movieApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Calendar, Clock, Globe, Warning } from '@phosphor-icons/react';

interface MovieDetailsViewProps {
  imdbID: string;
  onBack: () => void;
}

export function MovieDetailsView({ imdbID, onBack }: MovieDetailsViewProps) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const details = await movieApi.getMovieDetails(imdbID);
        if (details) {
          setMovie(details);
        } else {
          setError('Movie details not found or unavailable');
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [imdbID]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="aspect-[2/3] bg-muted rounded-lg"></div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>
        <Card className="p-8 text-center border-destructive/20 bg-destructive/5">
          <Warning className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold text-destructive mb-2">Unable to Load Movie Details</h3>
          <p className="text-muted-foreground mb-4">{error || 'Movie not found'}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Create a simple placeholder SVG data URL
    const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="600" fill="#2a2a2a"/><text x="200" y="280" text-anchor="middle" fill="#666" font-family="Arial" font-size="16">No Image</text><text x="200" y="320" text-anchor="middle" fill="#666" font-family="Arial" font-size="16">Available</text></svg>`)}`;
    e.currentTarget.src = placeholderSvg;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Search
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <img
            src={movie.Poster !== 'N/A' ? movie.Poster : `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="600" fill="#2a2a2a"/><text x="200" y="280" text-anchor="middle" fill="#666" font-family="Arial" font-size="16">No Image</text><text x="200" y="320" text-anchor="middle" fill="#666" font-family="Arial" font-size="16">Available</text></svg>`)}`}
            alt={movie.Title}
            onError={handleImageError}
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{movie.Title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{movie.Year}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{movie.Runtime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span>{movie.Language}</span>
              </div>
              {movie.Rated && <Badge variant="outline">{movie.Rated}</Badge>}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.Genre.split(', ').map((genre) => (
                <Badge key={genre} variant="secondary">{genre}</Badge>
              ))}
            </div>
          </div>

          {movie.imdbRating !== 'N/A' && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 fill-accent text-accent" />
                <span className="text-2xl font-bold">{movie.imdbRating}</span>
                <span className="text-muted-foreground">/10</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {movie.imdbVotes} votes
              </p>
            </Card>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-3">Plot</h2>
            <p className="text-foreground leading-relaxed">{movie.Plot}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Director</h3>
              <p className="text-muted-foreground">{movie.Director}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Cast</h3>
              <p className="text-muted-foreground">{movie.Actors}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Released</h3>
              <p className="text-muted-foreground">{movie.Released}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Country</h3>
              <p className="text-muted-foreground">{movie.Country}</p>
            </div>
          </div>

          {movie.Awards !== 'N/A' && (
            <div>
              <h3 className="font-semibold mb-2">Awards</h3>
              <p className="text-muted-foreground">{movie.Awards}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}