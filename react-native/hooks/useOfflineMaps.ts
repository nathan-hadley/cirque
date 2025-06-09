import { useState, useCallback, useEffect } from 'react';
import Mapbox from '@rnmapbox/maps';
import { TILEPACK_ID, STYLE_URI, BBOX_COORDS } from '@/constants/map';

interface OfflineMapsState {
  loading: boolean;
  mapDownloaded: boolean;
  updateMapData: () => Promise<{ success: boolean; message: string }>;
}

interface OfflinePack {
  name: string;
  [key: string]: any;
}

export function useOfflineMaps(): OfflineMapsState {
  const [loading, setLoading] = useState(false);
  const [mapDownloaded, setMapDownloaded] = useState(false);

  const checkIfMapExists = async (): Promise<boolean> => {
    try {
      const packs = await Mapbox.offlineManager.getPacks();
      return packs.some((pack: OfflinePack) => pack.name === TILEPACK_ID);
    } catch (error) {
      console.error('Error checking if map exists:', error);
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
        console.error('Error initializing map state:', error);
        setMapDownloaded(false);
      }
    };

    initializeMapState();
  }, []);

  const updateMapData = async (): Promise<{ success: boolean; message: string }> => {
    setLoading(true);

    try {
      const packExists = await checkIfMapExists();

      if (packExists) {
        await Mapbox.offlineManager.deletePack(TILEPACK_ID);
      }

      await Mapbox.offlineManager.createPack(
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
        (progressObj) => {
          console.log('Download progress:', progressObj);
        },
        (error) => {
          console.error('Offline pack error:', error);
          return { success: false, message: 'Failed to download map data. Error: ' + error };
        }
      );

      setMapDownloaded(true);
      const message = packExists ? 'Map updated successfully' : 'Map downloaded successfully';
      return { success: true, message };
    } catch (error) {
      console.error('Error updating map data:', error);
      return { success: false, message: 'Failed to download map data. Error: ' + error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    mapDownloaded,
    updateMapData,
  };
} 