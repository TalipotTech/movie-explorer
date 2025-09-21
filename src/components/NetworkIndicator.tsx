import { useState, useEffect } from 'react';
import { WifiHigh, WifiX } from '@phosphor-icons/react';

export function NetworkIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide offline message after 5 seconds when back online
  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      const timer = setTimeout(() => setShowOfflineMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md border transition-all duration-300 ${
      isOnline 
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
        : 'bg-destructive/10 border-destructive/20 text-destructive'
    }`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {isOnline ? (
          <>
            <WifiHigh className="w-4 h-4" />
            <span>Connection restored</span>
          </>
        ) : (
          <>
            <WifiX className="w-4 h-4" />
            <span>No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
}