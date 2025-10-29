import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Mapbox, { Camera, MapView as RNMapboxMapView, UserLocation } from "@rnmapbox/maps";
import { Feature, GeoJsonProperties, Geometry } from "geojson";
import { FilterButton } from "@/components/buttons/FilterButton";
import { INITIAL_CENTER, INITIAL_ZOOM, MAPBOX_ACCESS_TOKEN, STYLE_URI } from "@/constants/map";
import { mapProblemService } from "@/services/mapProblemService";
import { useMapStore } from "@/stores/mapStore";
import { useProblemStore } from "@/stores/problemStore";
import { LocateMeButton } from "../../components/buttons/LocateMeButton";
import { MapSearchBar } from "../../components/MapSearchBar";
import { SearchOverlay } from "../SearchScreen";
import GradeFilterSheet from "./GradeFilterSheet";
import {
  AreaLabelsLayer,
  BouldersLayer,
  CircuitLineLayer,
  ProblemsLayer,
  SelectedProblemLayer,
  SubareaLabelsLayer,
  SubareasLayer,
} from "./layers";
import { ProblemSheet } from "./ProblemSheet";

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export function MapScreen() {
  // Local state for overlays
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Map store for map-specific state and actions
  const { centerToUserLocation, setMapRef, setCameraRef } = useMapStore();

  // Problem store for problem-specific state
  const { problem, viewProblem, setViewProblem, getCircuitLine, setMinGrade, setMaxGrade } =
    useProblemStore();

  const currentCircuitLine = getCircuitLine();

  const mapRef = useRef<RNMapboxMapView>(null);
  const cameraRef = useRef<Camera>(null);

  const tabBarHeight = useBottomTabBarHeight();
  const bottomOffset = Platform.OS === "ios" ? tabBarHeight : 0;

  // Set refs in the store when they're created
  useEffect(() => {
    setMapRef(mapRef);
    setCameraRef(cameraRef);
  }, [setMapRef, setCameraRef]);

  const gestureOptions = {
    pitchEnabled: false,
    rotateEnabled: false,
  };

  function handleMapPress(feature: Feature<Geometry, GeoJsonProperties>) {
    const { screenPointX, screenPointY } = feature.properties || {};
    if (screenPointX && screenPointY) {
      mapProblemService.handleMapTap({
        x: screenPointX,
        y: screenPointY,
      });
    }
  }

  function handleGradeFilterSet(minGrade: number, maxGrade: number) {
    setMinGrade(minGrade);
    setMaxGrade(maxGrade);
    setIsFilterVisible(false);
  }

  return (
    <View className="flex-1">
      <RNMapboxMapView
        ref={mapRef}
        styleURL={STYLE_URI}
        scaleBarEnabled={false}
        compassEnabled={false}
        gestureSettings={gestureOptions}
        onPress={handleMapPress}
        style={{ flex: 1 }}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={INITIAL_CENTER}
          zoomLevel={INITIAL_ZOOM}
          animationDuration={0}
        />
        <BouldersLayer />
        <CircuitLineLayer
          circuitLine={currentCircuitLine}
          visible={!!problem}
          circuitColor={problem?.color}
        />
        <SelectedProblemLayer />
        <ProblemsLayer />
        <SubareasLayer />
        <SubareaLabelsLayer />
        <AreaLabelsLayer />
        <UserLocation showsUserHeadingIndicator={true} />
      </RNMapboxMapView>

      <MapSearchBar onPress={() => setIsSearchVisible(true)} />

      <FilterButton
        onPress={() => setIsFilterVisible(true)}
        className="absolute right-4"
        style={{ bottom: bottomOffset + 72 }}
      />

      <LocateMeButton
        onPress={centerToUserLocation}
        className="absolute right-4"
        style={{ bottom: bottomOffset + 16 }}
      />

      <ProblemSheet
        problem={problem}
        isOpen={viewProblem && problem !== null}
        onClose={() => setViewProblem(false)}
        closeOnOverlayClick={false}
        snapPoints={Platform.OS === "ios" ? [50] : undefined}
      />

      <SearchOverlay isVisible={isSearchVisible} onClose={() => setIsSearchVisible(false)} />

      <GradeFilterSheet isOpen={isFilterVisible} onClose={handleGradeFilterSet} />
    </View>
  );
}
