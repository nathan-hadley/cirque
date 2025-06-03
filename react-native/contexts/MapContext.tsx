import React, { createContext, useState, useRef, ReactNode } from 'react';
import { Dimensions } from 'react-native';
import { MapView, Camera } from '@rnmapbox/maps';
import { Feature, FeatureCollection, GeoJsonProperties, Geometry, Point } from 'geojson';
import * as Location from 'expo-location';
import { PROBLEMS_LAYER } from '@/constants/map';
import { createProblemFromFeature, Problem } from '@/models/problems';

type MapContextType = {
  mapRef: React.RefObject<MapView>;
  cameraRef: React.RefObject<Camera>;
  problem: Problem | null;
  viewProblem: boolean;
  setProblem: (problem: Problem | null) => void;
  setViewProblem: (view: boolean) => void;
  showPreviousProblem: () => Promise<void>;
  showNextProblem: () => Promise<void>;
  handleMapTap: (point: { x: number; y: number }) => Promise<void>;
  centerToUserLocation: () => Promise<void>;
};

export const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [viewProblem, setViewProblem] = useState(false);
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);

  async function centerToUserLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        alert({
          title: 'Location Permission Required',
          message:
            'Cirque needs access to your location to show your position on the map. Please enable location permissions in your device settings.',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [location.coords.longitude, location.coords.latitude],
          zoomLevel: 16,
          animationDuration: 1000,
        });
      }
    } catch (error) {
      alert({
        title: 'Location Error',
        message:
          'Unable to get your current location. Please make sure location services are enabled on your device.',
      });
    }
  }

  async function handleMapTap(point: { x: number; y: number }) {
    if (!mapRef.current) return;

    try {
      const query = await mapRef.current.queryRenderedFeaturesAtPoint([point.x, point.y], {
        layerIds: [PROBLEMS_LAYER],
        filter: ['!=', ['get', 'color'], ''],
      });

      if (query) getProblemFromQuery(query);
    } catch (error) {
      console.error('Error querying features:', error);
    }
  }

  async function showPreviousProblem() {
    if (!mapRef.current || !problem || problem.order === undefined) return;
    await fetchAdjacentProblem(problem, -1);
  }

  async function showNextProblem() {
    if (!mapRef.current || !problem || problem.order === undefined) return;
    await fetchAdjacentProblem(problem, 1);
  }

  async function fetchAdjacentProblem(currentProblem: Problem, offset: number) {
    if (!mapRef.current) return;

    const newProblemOrder = (currentProblem.order || 0) + offset;

    try {
      const query = await mapRef.current.querySourceFeatures(
        'composite',
        [
          'all',
          ['==', ['get', 'color'], currentProblem.colorStr],
          ['==', ['get', 'subarea'], currentProblem.subarea || ''],
          [
            'any',
            ['==', ['get', 'order'], newProblemOrder.toString()],
            ['==', ['get', 'order'], newProblemOrder],
          ],
        ],
        [PROBLEMS_LAYER]
      );

      getProblemFromQuery(query);
    } catch (error) {
      console.error('Error fetching adjacent problem:', error);
    }
  }

  function getProblemFromQuery(query: FeatureCollection<Geometry, GeoJsonProperties>) {
    if (query && query.features && query.features.length > 0) {
      const feature = query.features[0] as Feature<Point, GeoJsonProperties>;
      const newProblem = createProblemFromFeature(feature);

      if (newProblem) {
        setProblem(newProblem);
        setViewProblem(true);

        if (newProblem.coordinates && cameraRef.current) {
          // Get screen dimensions to calculate offset for actionsheet
          const screenHeight = Dimensions.get('window').height;
          const centerOffset = screenHeight * 0.4;

          cameraRef.current.setCamera({
            centerCoordinate: newProblem.coordinates,
            animationDuration: 500,
            padding: {
              paddingBottom: centerOffset,
              paddingTop: 0,
              paddingLeft: 0,
              paddingRight: 0,
            },
          });
        }
      }
    }
  }

  const value: MapContextType = {
    problem,
    setProblem,
    viewProblem,
    setViewProblem,
    mapRef,
    cameraRef,
    handleMapTap,
    showPreviousProblem,
    showNextProblem,
    centerToUserLocation,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
