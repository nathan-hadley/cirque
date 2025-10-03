import { create } from "zustand";
import { Alert, Dimensions } from "react-native";
import { MapView, Camera } from "@rnmapbox/maps";
import { Feature, GeoJsonProperties, Point } from "geojson";
import * as Location from "expo-location";
import { RefObject } from "react";

type MapState = {
  // State
  mapRef: RefObject<MapView> | null;
  cameraRef: RefObject<Camera> | null;

  // Actions
  setMapRef: (ref: RefObject<MapView | null>) => void;
  setCameraRef: (ref: RefObject<Camera | null>) => void;
  handleMapTap: (point: {
    x: number;
    y: number;
  }) => Promise<Feature<Point, GeoJsonProperties> | null>;
  centerToUserLocation: () => Promise<void>;
  flyToProblemCoordinates: (coordinates: [number, number], zoomLevel?: number) => void;
};

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  mapRef: null,
  cameraRef: null,

  // Actions
  setMapRef: (ref: RefObject<MapView | null>) => set({ mapRef: ref as RefObject<MapView> }),
  setCameraRef: (ref: RefObject<Camera | null>) => set({ cameraRef: ref as RefObject<Camera> }),

  flyToProblemCoordinates: (coordinates: [number, number], zoomLevel?: number) => {
    const { cameraRef } = get();

    if (coordinates && cameraRef?.current) {
      // Get screen dimensions to calculate offset for actionsheet
      const screenHeight = Dimensions.get("window").height;
      const centerOffset = screenHeight * 0.4;

      cameraRef.current.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: zoomLevel || 19,
        animationDuration: 500,
        padding: {
          paddingBottom: centerOffset,
          paddingTop: 0,
          paddingLeft: 0,
          paddingRight: 0,
        },
      });
    }
  },

  centerToUserLocation: async () => {
    const { cameraRef } = get();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Cirque needs access to your location to show your position on the map. Please enable location permissions in your device settings.",
          [{ text: "OK" }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (cameraRef?.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [location.coords.longitude, location.coords.latitude],
          zoomLevel: 16,
          animationDuration: 1000,
        });
      }
    } catch {
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please make sure location services are enabled on your device.",
        [{ text: "OK" }]
      );
    }
  },

  handleMapTap: async (point: { x: number; y: number }) => {
    const { mapRef } = get();
    if (!mapRef?.current) return null;

    try {
      const query = await mapRef.current.queryRenderedFeaturesAtPoint([point.x, point.y], {
        layerIds: ["problems-layer"],
        filter: ["!=", ["get", "color"], ""],
      });

      if (query && query.features && query.features.length > 0) {
        const feature = query.features[0] as Feature<Point, GeoJsonProperties>;
        // Return the feature so the calling component can handle it
        // This keeps the map and problem stores decoupled
        return feature;
      }
    } catch (error) {
      console.error("Error querying features:", error);
    }
    return null;
  },
}));
