import React, { createContext, useState, useRef, ReactNode } from 'react';
import { Alert, Dimensions } from 'react-native';
import { MapView, Camera } from '@rnmapbox/maps';
import { Feature, FeatureCollection, GeoJsonProperties, Point } from 'geojson';
import * as Location from 'expo-location';
import { problemsData } from '@/assets/problems';
import { createProblemFromFeature, Problem } from '@/models/problems';

type MapContextType = {
  mapRef: React.RefObject<MapView>;
  cameraRef: React.RefObject<Camera>;
  problem: Problem | null;
  viewProblem: boolean;
  problemsData: FeatureCollection<Point, GeoJsonProperties> | null;
  setProblem: (problem: Problem | null) => void;
  getProblem: (circuitColor: string, subarea: string, order: number) => Problem | null;
  setViewProblem: (view: boolean) => void;
  showPreviousProblem: () => Promise<void>;
  showNextProblem: () => Promise<void>;
  handleMapTap: (point: { x: number; y: number }) => Promise<void>;
  centerToUserLocation: () => Promise<void>;
  navigateToFirstProblem: (circuitColor: string, subarea: string) => Promise<void>;
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
        Alert.alert(
          'Location Permission Required',
          'Cirque needs access to your location to show your position on the map. Please enable location permissions in your device settings.',
          [{ text: 'OK' }],
        );
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
    } catch {
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please make sure location services are enabled on your device.',
        [{ text: 'OK' }],
      );
    }
  }

  async function handleMapTap(point: { x: number; y: number }) {
    if (!mapRef.current) return;

    try {
      const query = await mapRef.current.queryRenderedFeaturesAtPoint([point.x, point.y], {
        layerIds: ['problems-layer'],
        filter: ['!=', ['get', 'color'], ''],
      });

      if (query && query.features && query.features.length > 0) {
        const feature = query.features[0] as Feature<Point, GeoJsonProperties>;
        const problem = createProblemFromFeature(feature);
        if (problem) navigateToProblem(problem);
      }
    } catch (error) {
      console.error('Error querying features:', error);
    }
  }

  async function showPreviousProblem() {
    if (!problem || problem.order === undefined) return;
    const newProblemOrder = (problem.order || 0) - 1;
    const newProblem = getProblem(problem.colorStr, problem.subarea || '', newProblemOrder);
    if (newProblem) navigateToProblem(newProblem);
  }

  async function showNextProblem() {
    if (!problem || problem.order === undefined) return;
    const newProblemOrder = (problem.order || 0) + 1;
    const newProblem = getProblem(problem.colorStr, problem.subarea || '', newProblemOrder);
    if (newProblem) navigateToProblem(newProblem);
  }

  async function navigateToFirstProblem(circuitColor: string, subarea: string) {
    const problem = getProblem(circuitColor, subarea, 1);

    if (problem) {
      navigateToProblem(problem);
    } else {
      Alert.alert('Error', 'Could not find the first problem in this circuit.');
    }
  }

  function getProblem(circuitColor: string, subarea: string, order: number): Problem | null {
    if (!problemsData) return null;

    const feature = problemsData.features.find((feature: Feature<Point, GeoJsonProperties>) => {
      const props = feature.properties;
      return (
        props?.color === circuitColor &&
        props?.subarea === subarea &&
        (props?.order === order || props?.order === order.toString())
      );
    }) || null;

    return feature ? createProblemFromFeature(feature) : null;
  }

  function navigateToProblem(problem: Problem) {
    if (problem) {
      setProblem(problem);
      setViewProblem(true);

      if (problem.coordinates && cameraRef.current) {
        // Get screen dimensions to calculate offset for actionsheet
        const screenHeight = Dimensions.get('window').height;
        const centerOffset = screenHeight * 0.4;

        cameraRef.current.setCamera({
          centerCoordinate: problem.coordinates,
          zoomLevel: 19,
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

  const value: MapContextType = {
    problem,
    getProblem,
    setProblem,
    viewProblem,
    setViewProblem,
    problemsData,
    mapRef,
    cameraRef,
    handleMapTap,
    showPreviousProblem,
    showNextProblem,
    centerToUserLocation,
    navigateToFirstProblem,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
