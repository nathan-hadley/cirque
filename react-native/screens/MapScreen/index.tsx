import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import Mapbox, { MapView as RNMapboxMapView, UserLocation, Camera } from "@rnmapbox/maps";
import { Actionsheet, ActionsheetContent } from "@/components/ui/actionsheet";
import { useMapStore } from "@/stores/mapStore";
import { useProblemStore } from "@/stores/problemStore";

import { mapProblemService } from "@/services/mapProblemService";
import { INITIAL_CENTER, INITIAL_ZOOM, STYLE_URI, MAPBOX_ACCESS_TOKEN } from "@/constants/map";
import { ProblemView } from "./ProblemView";
import { LocateMeButton } from "../../components/buttons/LocateMeButton";
import { MapSearchBar } from "../../components/MapSearchBar";
import { SearchOverlay } from "../SearchScreen";
import GradeFilter from "../../components/GradeFilter";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  BouldersLayer,
  ProblemsLayer,
  SelectedProblemLayer,
  CircuitLineLayer,
  SubareaLabelsLayer,
} from "./layers";

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export function MapScreen() {
  // Local state for search overlay
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Map store for map-specific state and actions
  const { centerToUserLocation, setMapRef, setCameraRef } = useMapStore();

  // Problem store for problem-specific state
  const { problem, viewProblem, setViewProblem, getFilteredCircuitLine } = useProblemStore();

  const currentCircuitLine = getFilteredCircuitLine();

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

  return (
    <View className="flex-1">
      <RNMapboxMapView
        ref={mapRef}
        styleURL={STYLE_URI}
        scaleBarEnabled={false}
        compassEnabled={false}
        gestureSettings={gestureOptions}
        onPress={e => {
          const { screenPointX, screenPointY } = e.properties || {};
          if (screenPointX && screenPointY) {
            mapProblemService.handleMapTap({
              x: screenPointX,
              y: screenPointY,
            });
          }
        }}
        style={{ flex: 1 }}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={INITIAL_CENTER}
          zoomLevel={INITIAL_ZOOM}
          animationDuration={0}
        />
        <UserLocation showsUserHeadingIndicator={true} />

        <BouldersLayer />
        <ProblemsLayer />
        <SelectedProblemLayer />
        <SubareaLabelsLayer />

        {/* Circuit Line - Only show for current problem's circuit */}
        <CircuitLineLayer
          circuitLine={currentCircuitLine}
          visible={viewProblem && !!problem}
          circuitColor={problem?.color}
        />
      </RNMapboxMapView>

      {/* Search Bar */}
      {!isSearchVisible && <MapSearchBar onPress={() => setIsSearchVisible(true)} />}

      {/* Grade Filter */}
      {!isSearchVisible && !viewProblem && (
        <View className="absolute top-20 left-0 right-0 z-10">
          <GradeFilter />
        </View>
      )}

      <LocateMeButton
        onPress={centerToUserLocation}
        className="absolute right-4"
        style={{ bottom: bottomOffset + 16 }}
      />

      {/* Problem ActionSheet */}
      <Actionsheet
        isOpen={viewProblem && problem !== null}
        onClose={() => setViewProblem(false)}
        closeOnOverlayClick={false}
        snapPoints={Platform.OS === "ios" ? [50] : undefined}
      >
        <ActionsheetContent className="p-0">
          {problem && <ProblemView problem={problem} />}
        </ActionsheetContent>
      </Actionsheet>

      {/* Search Overlay */}
      <SearchOverlay isVisible={isSearchVisible} onClose={() => setIsSearchVisible(false)} />
    </View>
  );
}
