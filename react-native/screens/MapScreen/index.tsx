import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import Mapbox, {
  MapView as RNMapboxMapView,
  UserLocation,
  Camera,
  ShapeSource,
  CircleLayer,
  SymbolLayer,
} from '@rnmapbox/maps';
import { Actionsheet, ActionsheetContent } from '@/components/ui/actionsheet';
import { useMapStore } from '@/stores/mapStore';
import { useProblemStore } from '@/stores/problemStore';
import { mapProblemService } from '@/services/mapProblemService';
import { INITIAL_CENTER, INITIAL_ZOOM, STYLE_URI, MAPBOX_ACCESS_TOKEN } from '@/constants/map';
import { ProblemView } from './ProblemView';
import { LocateMeButton } from '../../components/buttons/LocateMeButton';
import { MapSearchBar } from '../../components/MapSearchBar';
import { SearchOverlay } from '../../components/SearchOverlay';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export function MapScreen() {
  // Local state for search overlay
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Map store for map-specific state and actions
  const { centerToUserLocation, setMapRef, setCameraRef } = useMapStore();

  // Problem store for problem-specific state
  const { problem, viewProblem, setViewProblem, problemsData } = useProblemStore();

  const mapRef = useRef<RNMapboxMapView>(null);
  const cameraRef = useRef<Camera>(null);

  const tabBarHeight = useBottomTabBarHeight();
  const bottomOffset = Platform.OS === 'ios' ? tabBarHeight : 0;

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
      {/* Search Bar */}
      {!isSearchVisible && (
        <MapSearchBar onPress={() => setIsSearchVisible(true)} />
      )}

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

        {/* Problems Data Source */}
        {problemsData && (
          <ShapeSource id="problems-source" shape={problemsData}>
            <CircleLayer
              id="problems-layer"
              style={{
                circleRadius: ['interpolate', ['linear'], ['zoom'], 16, 3, 22, 20],
                circleColor: [
                  'case',
                  ['==', ['get', 'color'], 'red'],
                  '#ff0000',
                  ['==', ['get', 'color'], 'blue'],
                  '#0000ff',
                  ['==', ['get', 'color'], 'black'],
                  '#000000',
                  ['==', ['get', 'color'], 'white'],
                  '#ffffff',
                  ['==', ['get', 'color'], 'green'],
                  '#00ff00',
                  ['==', ['get', 'color'], 'yellow'],
                  '#ffff00',
                  '#888888', // default color
                ],
                circleStrokeWidth: 0,
                circleOpacity: [
                  'step',
                  ['zoom'],
                  0, // hidden below zoom 16
                  16,
                  0.8, // visible at zoom 16+
                ],
              }}
            />
            <SymbolLayer
              id="problems-text-layer"
              style={{
                textField: ['get', 'order'],
                textSize: ['interpolate', ['linear'], ['zoom'], 17, 8, 22, 26],
                textColor: [
                  'case',
                  ['==', ['get', 'color'], 'white'],
                  '#000000', // black text for white circles
                  '#ffffff', // white text for all other circles
                ],
                textFont: ['Open Sans Regular', 'Arial Unicode MS Regular'],
                textAnchor: 'center',
                textOffset: [0, 0],
                textAllowOverlap: true,
                textIgnorePlacement: true,
                textOpacity: [
                  'step',
                  ['zoom'],
                  0, // hidden below zoom 17
                  17,
                  1, // visible at zoom 17+
                ],
              }}
            />
          </ShapeSource>
        )}
      </RNMapboxMapView>

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
        snapPoints={Platform.OS === 'ios' ? [50] : undefined}
      >
        <ActionsheetContent className="p-0">
          {problem && <ProblemView problem={problem} />}
        </ActionsheetContent>
      </Actionsheet>

      {/* Search Overlay */}
      <SearchOverlay 
        isVisible={isSearchVisible} 
        onClose={() => setIsSearchVisible(false)} 
      />
    </View>
  );
}
