import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiHigh, WifiX, Warning } from '@phosphor-icons/react';
import { movieApi } from '@/lib/movieApi';

interface ConnectionStatusProps {
  onRetry?: () => void;
  isVisible: boolean;
}

export function ConnectionStatus({ onRetry, isVisible }: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('checking');
    
    try {
      const isConnected = await movieApi.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('disconnected');
    } finally {
      setIsTestingConnection(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      testConnection();
    }
  }, [isVisible]);

  if (!isVisible || connectionStatus === 'connected') {
    return null;
  }

  return (
    <Card className="p-6 border-destructive/20 bg-destructive/5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        {connectionStatus === 'checking' ? (
          <WifiHigh className="w-5 h-5 text-muted-foreground animate-pulse" />
        ) : (
          <WifiX className="w-5 h-5 text-destructive" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-destructive">
            {connectionStatus === 'checking' ? 'Checking Connection...' : 'Connection Issue'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {connectionStatus === 'checking' 
              ? 'Testing connection to movie database...'
              : 'Unable to connect to the movie database. Please check your internet connection.'
            }
          </p>
        </div>
      </div>
      
      {connectionStatus === 'disconnected' && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Button>
          {onRetry && (
            <Button
              variant="outline" 
              size="sm"
              onClick={onRetry}
            >
              Retry Search
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}