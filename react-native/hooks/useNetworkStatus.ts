import { useEffect, useState } from "react";
import * as Network from "expo-network";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Track mount state to prevent state updates after unmount
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkNetworkState = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        if (isMounted) {
          setIsOnline(networkState.isInternetReachable === true);
        }
      } catch (error) {
        console.error("Network connectivity check failed:", error);
        if (isMounted) {
          setIsOnline(false);
        }
      }
    };

    // Check initial state
    checkNetworkState();

    // Poll network state every 3 seconds
    intervalId = setInterval(checkNetworkState, 3000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return { isOnline };
}
