import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { GlassContainer } from "expo-glass-effect";
import Mapbox, { Camera, MapView as RNMapboxMapView, UserLocation } from "@rnmapbox/maps";
import { Feature, GeoJsonProperties, Geometry } from "geojson";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterButton } from "@/components/buttons/FilterButton";
import { isLiquidGlassAvailable } from "@/components/ui/GlassSurface";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { INITIAL_CENTER, INITIAL_ZOOM, MAPBOX_ACCESS_TOKEN, STYLE_URI } from "@/constants/map";
import { mapProblemService } from "@/services/mapProblemService";
import { useDataStore } from "@/stores/dataStore";
import { useMapStore } from "@/stores/mapStore";
import { selectCircuitLine, useProblemStore } from "@/stores/problemStore";
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
  const { problem, viewProblem, setViewProblem, minGrade, maxGrade, setMinGrade, setMaxGrade } =
    useProblemStore();
  const problemsData = useDataStore(state => state.data.problems);

  // Derived from reactive state rather than a store getter, so React Compiler can see the
  // inputs this depends on and recompute the line when the problem or filter changes.
  const currentCircuitLine = selectCircuitLine(problemsData, problem, minGrade, maxGrade);

  const mapRef = useRef<RNMapboxMapView>(null);
  const cameraRef = useRef<Camera>(null);
  const insets = useSafeAreaInsets();

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
        testID="problem-map"
        accessibilityLabel="Problem map"
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

      <View className="absolute right-4" style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 16 }}>
        {isLiquidGlassAvailable() ? (
          <GlassContainer spacing={12} style={{ gap: 12 }}>
            <FilterButton onPress={() => setIsFilterVisible(true)} />
            <LocateMeButton onPress={centerToUserLocation} />
          </GlassContainer>
        ) : (
          <View style={{ gap: 12 }}>
            <FilterButton onPress={() => setIsFilterVisible(true)} />
            <LocateMeButton onPress={centerToUserLocation} />
          </View>
        )}
      </View>

      <ProblemSheet
        problem={problem}
        isOpen={viewProblem && problem !== null}
        onClose={() => setViewProblem(false)}
      />

      <SearchOverlay isVisible={isSearchVisible} onClose={() => setIsSearchVisible(false)} />

      <GradeFilterSheet isOpen={isFilterVisible} onClose={handleGradeFilterSet} />
    </View>
  );
}
