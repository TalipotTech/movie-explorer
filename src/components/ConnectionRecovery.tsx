import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  WifiX, 
  WifiHigh, 
  WifiMedium, 
  ArrowClockwise, 
  CheckCircle,
  Warning
} from '@phosphor-icons/react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

interface ConnectionRecoveryProps {
  onRetry?: () => void;
  showSuccess?: boolean;
}

export function ConnectionRecovery({ onRetry, showSuccess = true }: ConnectionRecoveryProps) {
  const { isOnline, isApiReachable, connectionQuality, checkConnection, isChecking } = useConnectionStatus();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  
  const isConnected = isOnline && isApiReachable;

  useEffect(() => {
    if (!isConnected) {
      setWasOffline(true);
    } else if (wasOffline && isConnected && showSuccess) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, wasOffline, showSuccess]);

  const handleRetry = async () => {
    await checkConnection();
    if (onRetry) {
      onRetry();
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiX className="w-5 h-5" />;
    if (!isApiReachable) return <WifiX className="w-5 h-5" />;
    if (connectionQuality === 'poor') return <WifiMedium className="w-5 h-5" />;
    return <WifiHigh className="w-5 h-5" />;
  };

  const getConnectionMessage = () => {
    if (!isOnline) {
      return 'No internet connection detected. Please check your network settings.';
    }
    if (!isApiReachable) {
      return 'Movie database is currently unreachable. This might be a temporary issue.';
    }
    if (connectionQuality === 'poor') {
      return 'Connection is slow. Some features may take longer to load.';
    }
    return 'Connection restored successfully!';
  };

  const getConnectionStatus = () => {
    if (!isOnline) return 'offline';
    if (!isApiReachable) return 'api-down';
    if (connectionQuality === 'poor') return 'slow';
    return 'connected';
  };

  // Success message when connection is restored
  if (showSuccessMessage && isConnected) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10 mb-6">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          Connection restored! You can now search for movies again.
        </AlertDescription>
      </Alert>
    );
  }

  // Connection warning for slow connections
  if (isConnected && connectionQuality === 'poor') {
    return (
      <Alert className="border-yellow-500/50 bg-yellow-500/10 mb-6">
        <Warning className="w-4 h-4 text-yellow-500" />
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          Slow connection detected. Movie searches may take longer than usual.
        </AlertDescription>
      </Alert>
    );
  }

  // Main error state
  if (!isConnected) {
    return (
      <Card className="p-6 mb-6 border-destructive/20 bg-destructive/5">
        <div className="flex items-start gap-4">
          <div className="text-destructive">
            {getConnectionIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-2">
              Connection Issue
            </h3>
            <p className="text-muted-foreground mb-4">
              {getConnectionMessage()}
            </p>
            
            {/* Troubleshooting tips */}
            <div className="mb-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Troubleshooting tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Disable any VPN or proxy</li>
                <li>Check if other websites are working</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleRetry}
                disabled={isChecking}
                size="sm"
              >
                <ArrowClockwise className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Checking...' : 'Try Again'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}