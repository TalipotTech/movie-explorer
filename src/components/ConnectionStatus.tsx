import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiHigh, WifiX, Warning, ArrowClockwise } from '@phosphor-icons/react';
import { movieApi } from '@/lib/movieApi';

interface ConnectionStatusProps {
  onRetry?: () => void;
  isVisible: boolean;
}

export function ConnectionStatus({ onRetry, isVisible }: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const maxAutoRetries = 2;

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('checking');
    
    try {
      const isConnected = await movieApi.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        setAutoRetryCount(0); // Reset counter on successful connection
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Auto-retry mechanism
  useEffect(() => {
    if (isVisible && connectionStatus === 'disconnected' && autoRetryCount < maxAutoRetries) {
      const retryTimeout = setTimeout(() => {
        setAutoRetryCount(prev => prev + 1);
        testConnection();
      }, 3000 * (autoRetryCount + 1)); // Exponential backoff: 3s, 6s

      return () => clearTimeout(retryTimeout);
    }
  }, [isVisible, connectionStatus, autoRetryCount]);

  useEffect(() => {
    if (isVisible) {
      setAutoRetryCount(0);
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
          <ArrowClockwise className="w-5 h-5 text-muted-foreground animate-spin" />
        ) : (
          <WifiX className="w-5 h-5 text-destructive" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-destructive">
            {connectionStatus === 'checking' ? 'Checking Connection...' : 'Connection Issue'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {connectionStatus === 'checking' 
              ? `Testing connection to movie database${autoRetryCount > 0 ? ` (attempt ${autoRetryCount + 1}/${maxAutoRetries + 1})` : ''}...`
              : 'Unable to connect to the movie database. Please check your internet connection.'
            }
          </p>
        </div>
      </div>
      
      {connectionStatus === 'disconnected' && (
        <>
          <div className="mb-4 p-3 bg-muted/30 rounded-md border">
            <p className="text-sm text-muted-foreground">
              <strong>Troubleshooting tips:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Disable VPN or proxy if enabled</li>
              <li>• Clear browser cache and cookies</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              <ArrowClockwise className={`w-4 h-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
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
        </>
      )}
    </Card>
  );
}