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
import GradeFilterSheet from "../../components/GradeFilterSheet";
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
  // Local state for overlays
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

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

  function handleMapPress(e: any) {
    const { screenPointX, screenPointY } = e.properties || {};
    if (screenPointX && screenPointY) {
      mapProblemService.handleMapTap({
        x: screenPointX,
        y: screenPointY,
      });
    }
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
        <ProblemsLayer />
        <SelectedProblemLayer />
        <SubareaLabelsLayer />
        <UserLocation showsUserHeadingIndicator={true} />
      </RNMapboxMapView>

      {!isSearchVisible && (
        <MapSearchBar 
          onPress={() => setIsSearchVisible(true)} 
          onFilterPress={() => setIsFilterVisible(true)}
        />
      )}

      <LocateMeButton
        onPress={centerToUserLocation}
        className="absolute right-4"
        style={{ bottom: bottomOffset + 16 }}
      />

      {/* Problem Sheet */}
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

      <SearchOverlay isVisible={isSearchVisible} onClose={() => setIsSearchVisible(false)} />

      <GradeFilterSheet 
        isOpen={isFilterVisible} 
        onClose={() => setIsFilterVisible(false)} 
      />
    </View>
  );
}
