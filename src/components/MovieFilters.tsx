import { useState } from 'react';
import { type MovieFilters } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Funnel, X } from '@phosphor-icons/react';

interface MovieFiltersProps {
  onFiltersChange: (filters: MovieFilters) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'Film-Noir', 'History', 'Horror', 'Music', 'Musical',
  'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
];

const currentYear = new Date().getFullYear();

export function MovieFilters({ onFiltersChange, isVisible, onToggle }: MovieFiltersProps) {
  const [filters, setFilters] = useState<MovieFilters>({
    genre: '',
    yearRange: { min: 1900, max: currentYear },
    minRating: 0
  });

  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const updateFilters = (newFilters: Partial<MovieFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Check if any filters are active
    const isActive = updatedFilters.genre !== '' || 
                    updatedFilters.yearRange.min > 1900 || 
                    updatedFilters.yearRange.max < currentYear ||
                    updatedFilters.minRating > 0;
    
    setHasActiveFilters(isActive);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      genre: '',
      yearRange: { min: 1900, max: currentYear },
      minRating: 0
    };
    setFilters(defaultFilters);
    setHasActiveFilters(false);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.genre) count++;
    if (filters.yearRange.min > 1900 || filters.yearRange.max < currentYear) count++;
    if (filters.minRating > 0) count++;
    return count;
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <Funnel className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Button>
        )}
      </div>

      {isVisible && (
        <Card className="p-6 mb-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filter Movies</h3>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Genre Filter */}
            <div className="space-y-2">
              <Label htmlFor="genre-select">Genre</Label>
              <Select
                value={filters.genre}
                onValueChange={(value) => updateFilters({ genre: value })}
              >
                <SelectTrigger id="genre-select">
                  <SelectValue placeholder="All genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All genres</SelectItem>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Range Filter */}
            <div className="space-y-3">
              <Label>Release Year Range</Label>
              <div className="px-2">
                <Slider
                  value={[filters.yearRange.min, filters.yearRange.max]}
                  onValueChange={([min, max]) => 
                    updateFilters({ yearRange: { min, max } })
                  }
                  min={1900}
                  max={currentYear}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.yearRange.min}</span>
                <span>{filters.yearRange.max}</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-3">
              <Label>Minimum Rating</Label>
              <div className="px-2">
                <Slider
                  value={[filters.minRating]}
                  onValueChange={([value]) => updateFilters({ minRating: value })}
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0.0</span>
                <span className="font-medium">{filters.minRating.toFixed(1)}+</span>
                <span>10.0</span>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {filters.genre && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Genre: {filters.genre}
                    <button
                      onClick={() => updateFilters({ genre: '' })}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                
                {(filters.yearRange.min > 1900 || filters.yearRange.max < currentYear) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Year: {filters.yearRange.min}-{filters.yearRange.max}
                    <button
                      onClick={() => updateFilters({ yearRange: { min: 1900, max: currentYear } })}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                
                {filters.minRating > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Rating: {filters.minRating.toFixed(1)}+
                    <button
                      onClick={() => updateFilters({ minRating: 0 })}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
}