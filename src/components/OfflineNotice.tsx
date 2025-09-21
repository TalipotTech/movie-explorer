import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiX, ArrowClockwise } from '@phosphor-icons/react';

interface OfflineNoticeProps {
  onRetry?: () => void;
}

export function OfflineNotice({ onRetry }: OfflineNoticeProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showNotice, setShowNotice] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Auto-hide notice after 3 seconds when back online
      setTimeout(() => setShowNotice(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotice) {
    return null;
  }

  return (
    <Card className={`p-4 mb-6 border transition-all duration-300 ${
      isOffline 
        ? 'border-destructive/20 bg-destructive/5' 
        : 'border-emerald-500/20 bg-emerald-500/5'
    }`}>
      <div className="flex items-center gap-3">
        <WifiX className={`w-5 h-5 ${isOffline ? 'text-destructive' : 'text-emerald-600'}`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${isOffline ? 'text-destructive' : 'text-emerald-600'}`}>
            {isOffline ? 'You are offline' : 'Connection restored'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isOffline 
              ? 'Please check your internet connection to search for movies.'
              : 'You can now search for movies again.'
            }
          </p>
        </div>
        {isOffline && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isOffline}
          >
            <ArrowClockwise className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}