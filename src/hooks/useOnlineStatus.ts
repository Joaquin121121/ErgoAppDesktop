import { useState, useEffect, useCallback } from "react";

const PING_INTERVAL = 3000; // Check every 3 seconds
const PING_URL = "https://www.google.com/generate_204";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

      const response = await fetch(PING_URL, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If we get here, we have a connection
      setIsOnline(true);
      setLastChecked(new Date());
    } catch (error) {
      // If fetch fails, we're offline
      setIsOnline(false);
      setLastChecked(new Date());
    }
  }, []);

  // Initial check
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Set up periodic checks
  useEffect(() => {
    const interval = setInterval(checkConnection, PING_INTERVAL);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Listen to browser's online/offline events as backup
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection(); // Double-check with a real request
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastChecked(new Date());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnection]);

  return {
    isOnline,
    lastChecked,
    checkConnection,
  };
}
