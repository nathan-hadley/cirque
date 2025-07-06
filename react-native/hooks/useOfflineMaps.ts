import { useState, useEffect } from "react";
import Mapbox from "@rnmapbox/maps";
import * as Network from "expo-network";
import { TILEPACK_ID, STYLE_URI, BBOX_COORDS } from "@/constants/map";

type OfflineMapsState = {
  loading: boolean;
  mapDownloaded: boolean;
  progress: number;
  updateMapData: () => Promise<{ success: boolean; message: string }>;
  deleteMapData: () => Promise<{ success: boolean; message: string }>;
};

export function useOfflineMaps(): OfflineMapsState {
  const [loading, setLoading] = useState(false);
  const [mapDownloaded, setMapDownloaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isInternetReachable === true;
    } catch (error) {
      console.error("Network connectivity check failed:", error);
      return false;
    }
  };

  const checkIfMapExists = async (): Promise<boolean> => {
    try {
      const packs = await Mapbox.offlineManager.getPacks();
      return packs.some(pack => pack.name === TILEPACK_ID);
    } catch (error) {
      console.error("Error checking if map exists:", error);
      return false;
    }
  };

  useEffect(() => {
    // Initialize the mapDownloaded state on mount
    const initializeMapState = async () => {
      try {
        const exists = await checkIfMapExists();
        setMapDownloaded(exists);
      } catch (error) {
        console.error("Error initializing map state:", error);
        setMapDownloaded(false);
      }
    };

    initializeMapState();
  }, []);

  const updateMapData = async (): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setProgress(0);

    try {
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        return {
          success: false,
          message: "No internet connection. Please check your network connectionand try again.",
        };
      }

      const packExists = await checkIfMapExists();

      if (packExists) {
        await Mapbox.offlineManager.deletePack(TILEPACK_ID);
      }

      // Use Promise wrapper to handle the callback-based createPack API
      await new Promise<void>((resolve, reject) => {
        Mapbox.offlineManager.createPack(
          {
            name: TILEPACK_ID,
            styleURL: STYLE_URI,
            bounds: [
              [BBOX_COORDS[0][0], BBOX_COORDS[0][1]],
              [BBOX_COORDS[2][0], BBOX_COORDS[2][1]],
            ],
            minZoom: 10,
            maxZoom: 16,
          },
          // Progress callback
          (pack: { name: string }, status: { state: string | number; percentage: number }) => {
            if (status) {
              const progressPercent = status.percentage || 0;
              setProgress(progressPercent);

              if (status.state === "complete" || status.state === 1) {
                setProgress(100);
                resolve();
              } else if (
                status.state === "inactive" ||
                status.state === "invalid" ||
                status.state === 0
              ) {
                reject(new Error(`Pack download failed with state: ${status.state}`));
              }
            }
          },
          // Error callback
          (pack: { name: string }) => {
            console.error("Offline pack error for pack:", pack.name);
            reject(new Error(`Download failed for pack: ${pack.name}`));
          }
        );
      });

      setMapDownloaded(true);
      const message = packExists ? "Map updated successfully" : "Map downloaded successfully";
      return { success: true, message };
    } catch (error) {
      console.error("Error updating map data:", error);
      return { success: false, message: `Failed to download map data. Error: ${error}` };
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const deleteMapData = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const packExists = await checkIfMapExists();

      if (!packExists) {
        return { success: false, message: "No offline maps to delete" };
      }

      await Mapbox.offlineManager.deletePack(TILEPACK_ID);
      setMapDownloaded(false);

      return { success: true, message: "Offline maps deleted successfully" };
    } catch (error) {
      console.error("Error deleting map data:", error);
      return { success: false, message: `Failed to delete map data. Error: ${error}` };
    }
  };

  return {
    loading,
    mapDownloaded,
    progress,
    updateMapData,
    deleteMapData,
  };
}
