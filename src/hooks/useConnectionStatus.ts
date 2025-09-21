import { useState, useEffect, useCallback } from 'react';
import { movieApi } from '@/lib/movieApi';

interface UseConnectionStatusReturn {
  isOnline: boolean;
  isApiReachable: boolean;
  lastChecked: Date | null;
  checkConnection: () => Promise<void>;
  isChecking: boolean;
}

export function useConnectionStatus(): UseConnectionStatusReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isApiReachable, setIsApiReachable] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const apiStatus = await movieApi.testConnection();
      setIsApiReachable(apiStatus);
      setLastChecked(new Date());
    } catch (error) {
      setIsApiReachable(false);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Check API when coming back online
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsApiReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Periodic health check every 30 seconds when online
    const healthCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        checkConnection();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, [checkConnection]);

  return {
    isOnline,
    isApiReachable,
    lastChecked,
    checkConnection,
    isChecking
  };
}