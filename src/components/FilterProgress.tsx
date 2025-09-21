import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CircleNotch } from '@phosphor-icons/react';

interface FilterProgressProps {
  current: number;
  total: number;
  isVisible: boolean;
}

export function FilterProgress({ current, total, isVisible }: FilterProgressProps) {
  if (!isVisible) return null;
  
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <CircleNotch className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Applying filters...</span>
      </div>
      
      <Progress value={percentage} className="w-full mb-2" />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Processing movie details</span>
        <span>{current} of {total}</span>
      </div>
    </Card>
  );
}