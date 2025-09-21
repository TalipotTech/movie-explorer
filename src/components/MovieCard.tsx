import { Movie } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/api/placeholder/300/450';
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 bg-card border-border"
      onClick={() => onClick(movie)}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/300/450'}
          alt={movie.Title}
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-1 group-hover:text-accent transition-colors">
          {movie.Title}
        </h3>
        <p className="text-muted-foreground text-sm">
          {movie.Year} • {movie.Type}
        </p>
      </div>
    </Card>
  );
}