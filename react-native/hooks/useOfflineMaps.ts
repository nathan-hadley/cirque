import { useState } from 'react';
import Mapbox from '@rnmapbox/maps';
import { TILEPACK_ID, STYLE_URI, BBOX_COORDS } from '@/constants/map';

interface OfflineMapsState {
  loading: boolean;
  mapDownloaded: boolean;
  successMessage: string;
  errorMessage: string;
  updateMapData: () => Promise<void>;
}

interface OfflinePack {
  name: string;
  [key: string]: any;
}

export function useOfflineMaps(): OfflineMapsState {
  const [loading, setLoading] = useState(false);
  const [mapDownloaded, setMapDownloaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Function to check if the map pack already exists
  const checkIfMapExists = async (): Promise<boolean> => {
    try {
      const packs = await Mapbox.offlineManager.getPacks();
      return packs.some((pack: OfflinePack) => pack.name === TILEPACK_ID);
    } catch (error) {
      console.error('Error checking if map exists:', error);
      return false;
    }
  };

  // Function to download or update the map data
  const updateMapData = async (): Promise<void> => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Check if the pack already exists
      const packExists = await checkIfMapExists();

      // If the pack exists, delete it first to update with fresh data
      if (packExists) {
        await Mapbox.offlineManager.deletePack(TILEPACK_ID);
      }

      // Create a new offline pack
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
        // Progress listener callback
        (progressObj) => {
          // Log progress information without accessing specific properties
          console.log('Download progress:', progressObj);
        },
        // Error listener callback
        (error) => {
          console.error('Offline pack error:', error);
        }
      );

      setMapDownloaded(true);
      setSuccessMessage(packExists ? 'Map updated successfully' : 'Map downloaded successfully');
    } catch (error) {
      console.error('Error updating map data:', error);
      setErrorMessage('Failed to download map data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    mapDownloaded,
    successMessage,
    errorMessage,
    updateMapData,
  };
} 