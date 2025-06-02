import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { MapView, Camera } from '@rnmapbox/maps';
import { Feature, GeoJsonProperties, Point } from 'geojson';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { PROBLEMS_LAYER } from '@/constants/map';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';

interface MapContextType {
  problem: Problem | null;
  setProblem: (problem: Problem | null) => void;
  viewProblem: boolean;
  setViewProblem: (view: boolean) => void;
  mapRef: React.RefObject<MapView>;
  cameraRef: React.RefObject<Camera>;
  handleMapTap: (point: { x: number; y: number }) => Promise<void>;
  showPreviousProblem: () => Promise<void>;
  showNextProblem: () => Promise<void>;
  centerToUserLocation: () => Promise<void>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [viewProblem, setViewProblem] = useState(false);
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);

  // Function to center the map on the user's location
  const centerToUserLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Cirque needs access to your location to show your position on the map. Please enable location permissions in your device settings.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
        return;
      }

      // Get the current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Use the camera to fly to the user's location
      if (cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [location.coords.longitude, location.coords.latitude],
          zoomLevel: 16,
          animationDuration: 1000,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please make sure location services are enabled on your device.',
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    }
  };

  // Function to handle tap on the map
  const handleMapTap = async (point: { x: number; y: number }) => {
    if (!mapRef.current) return;

    try {
      // Increase the size of the area to query (tappable area)
      const query = await mapRef.current.queryRenderedFeaturesAtPoint([point.x, point.y], {
        layerIds: [PROBLEMS_LAYER],
        filter: ['!=', ['get', 'color'], ''],
      });

      // The queryRenderedFeaturesAtPoint returns a feature collection
      // We need to check if there are any features in the result
      if (query && query.features && query.features.length > 0) {
        // Get the first feature from the result
        const feature = query.features[0] as Feature<Point, GeoJsonProperties>;
        const problem = createProblemFromFeature(feature);

        if (!problem) setProblem(null);
        else setNewProblem(problem);
      }
    } catch (error) {
      console.error('Error querying features:', error);
    }
  };

  // Function to show the previous problem in the circuit
  const showPreviousProblem = async () => {
    if (!mapRef.current || !problem || problem.order === undefined) return;
    await fetchAdjacentProblem(problem, -1);
  };

  // Function to show the next problem in the circuit
  const showNextProblem = async () => {
    if (!mapRef.current || !problem || problem.order === undefined) return;
    await fetchAdjacentProblem(problem, 1);
  };

  // Helper function to fetch adjacent problems
  const fetchAdjacentProblem = async (currentProblem: Problem, offset: number) => {
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

      if (query && query.features && query.features.length > 0) {
        const feature = query.features[0] as Feature<Point, GeoJsonProperties>;
        const newProblem = createProblemFromFeature(feature);

        if (!newProblem) setProblem(null);
        else setNewProblem(newProblem);
      } else {
        console.log(`No feature found with order ${newProblemOrder}`);
      }
    } catch (error) {
      console.error('Error fetching adjacent problem:', error);
    }
  };

  // Helper function to set a new problem and animate to it
  const setNewProblem = (problem: Problem) => {
    setProblem(problem);
    setViewProblem(true);

    if (problem.coordinates && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: problem.coordinates,
        animationDuration: 500,
      });
    }
  };

  // Helper function to create a Problem object from a GeoJSON feature
  const createProblemFromFeature = (feature: Feature<Point, GeoJsonProperties>): Problem | null => {
    const properties = feature.properties || {};
    const name = properties.name?.toString();
    const topo = properties.topo?.toString();

    if (!name || !topo) return null;

    const coordinates = feature.geometry?.coordinates?.slice(0, 2) as [number, number];

    const order =
      typeof properties.order === 'number'
        ? properties.order
        : properties.order
          ? parseInt(properties.order.toString(), 10)
          : undefined;

    let line: number[][] = [];
    try {
      if (properties.line && typeof properties.line === 'string') {
        line = JSON.parse(properties.line);
      }
    } catch (error) {
      console.error('Failed to parse topo line coordinates:', error);
    }

    return {
      id: properties.id?.toString() || Date.now().toString(),
      name,
      grade: properties.grade?.toString(),
      order,
      colorStr: properties.color?.toString() || '',
      color: getColorFromString(properties.color?.toString()),
      description: properties.description?.toString(),
      line,
      topo,
      subarea: properties.subarea?.toString(),
      coordinates,
    };
  };

  // Helper function to get color from string
  const getColorFromString = (colorString?: string): string => {
    switch (colorString) {
      case 'blue':
        return '#3B82F6';
      case 'white':
        return '#FFFFFF';
      case 'red':
        return '#EF4444';
      case 'orange':
        return '#F97316';
      case 'yellow':
        return '#FACC15';
      case 'black':
        return '#000000';
      default:
        return '#000000';
    }
  };

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

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
} 