import React from 'react';
import { Platform, View } from 'react-native';
import Mapbox, { MapView as RNMapboxMapView, UserLocation, Camera, ShapeSource, CircleLayer } from '@rnmapbox/maps';
import { Actionsheet, ActionsheetContent } from '@/components/ui/actionsheet';
import { useMapContext } from '@/hooks/useMapContext';
import { INITIAL_CENTER, INITIAL_ZOOM, STYLE_URI, MAPBOX_ACCESS_TOKEN } from '@/constants/map';
import { ProblemView } from './ProblemView';
import { LocateMeButton } from '../../components/buttons/LocateMeButton';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export function MapScreen() {
  const {
    problem,
    viewProblem,
    setViewProblem,
    problemsData,
    mapRef,
    cameraRef,
    handleMapTap,
    centerToUserLocation,
  } = useMapContext();

  const tabBarHeight = useBottomTabBarHeight();
  const bottomOffset = Platform.OS === 'ios' ? tabBarHeight : 0;

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
            handleMapTap({
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
                circleRadius: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 3,
                  16, 8,
                  20, 12
                ],
                circleColor: [
                  'case',
                  ['==', ['get', 'color'], 'red'], '#ff0000',
                  ['==', ['get', 'color'], 'blue'], '#0000ff',
                  ['==', ['get', 'color'], 'black'], '#000000',
                  ['==', ['get', 'color'], 'white'], '#ffffff',
                  ['==', ['get', 'color'], 'green'], '#00ff00',
                  ['==', ['get', 'color'], 'yellow'], '#ffff00',
                  '#888888' // default color
                ],
                circleStrokeWidth: 0,
                circleOpacity: 0.8
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
        snapPoints={[50]}
      >
        <ActionsheetContent className="p-0">
          {problem && <ProblemView problem={problem} />}
        </ActionsheetContent>
      </Actionsheet>
    </View>
  );
}
