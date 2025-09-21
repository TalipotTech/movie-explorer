import { useState, useEffect, useCallback, useRef } from 'react';
import { movieApi } from '@/lib/movieApi';

interface UseConnectionStatusReturn {
  isOnline: boolean;
  isApiReachable: boolean;
  lastChecked: Date | null;
  checkConnection: () => Promise<void>;
  isChecking: boolean;
  connectionQuality: 'good' | 'poor' | 'offline';
}

export function useConnectionStatus(): UseConnectionStatusReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isApiReachable, setIsApiReachable] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const checkingRef = useRef(false);
  const failureCountRef = useRef(0);

  const checkConnection = useCallback(async () => {
    if (checkingRef.current) return;
    
    checkingRef.current = true;
    setIsChecking(true);
    
    try {
      const startTime = Date.now();
      const apiStatus = await movieApi.testConnection();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (apiStatus) {
        setIsApiReachable(true);
        failureCountRef.current = 0;
        
        // Determine connection quality based on response time
        if (responseTime < 2000) {
          setConnectionQuality('good');
        } else if (responseTime < 5000) {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('poor');
        }
      } else {
        setIsApiReachable(false);
        failureCountRef.current++;
        setConnectionQuality('offline');
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.warn('Connection check failed:', error);
      setIsApiReachable(false);
      failureCountRef.current++;
      setConnectionQuality('offline');
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
      checkingRef.current = false;
    }
  }, []);

  // Force reset connection status
  const resetConnection = useCallback(() => {
    setIsApiReachable(true);
    setConnectionQuality('good');
    failureCountRef.current = 0;
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser detected online status');
      setIsOnline(true);
      resetConnection();
      // Check API when coming back online with a small delay
      setTimeout(() => {
        checkConnection();
      }, 1000);
    };

    const handleOffline = () => {
      console.log('Browser detected offline status');
      setIsOnline(false);
      setIsApiReachable(false);
      setConnectionQuality('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check with delay to allow app to settle
    setTimeout(() => {
      checkConnection();
    }, 500);

    // Adaptive health check interval based on failure count
    const healthCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        // More frequent checks if we've had failures
        const interval = failureCountRef.current > 0 ? 15000 : 45000;
        checkConnection();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, [checkConnection, resetConnection]);

  return {
    isOnline,
    isApiReachable,
    lastChecked,
    checkConnection,
    isChecking,
    connectionQuality
  };
}