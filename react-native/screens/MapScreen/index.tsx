import React from 'react';
import { View } from 'react-native';
import Mapbox, { MapView as RNMapboxMapView, UserLocation, Camera } from '@rnmapbox/maps';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from '@/components/ui/actionsheet';
import { useMapViewModel } from '@/hooks/useMapViewModel';
import { INITIAL_CENTER, INITIAL_ZOOM, STYLE_URI, MAPBOX_ACCESS_TOKEN } from '@/constants/map';
import { ProblemView } from './ProblemView';
import { LocateMeButton } from '../../components/buttons/LocateMeButton';
import { CircuitNavButtons } from '../../components/buttons/CircuitNavButtons';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export function MapScreen() {
  const {
    problem,
    viewProblem,
    setViewProblem,
    mapRef,
    cameraRef,
    handleMapTap,
    showPreviousProblem,
    showNextProblem,
    centerToUserLocation,
  } = useMapViewModel();

  const gestureOptions = {
    pitchEnabled: false,
    rotateEnabled: false,
  };

  return (
    <View className="flex-1">
      <RNMapboxMapView
        ref={mapRef}
        styleURL={STYLE_URI}
        scaleBarEnabled={true}
        compassEnabled={true}
        gestureSettings={gestureOptions}
        onPress={(e) => {
          const { screenPointX, screenPointY } = e.properties || {};
          if (screenPointX && screenPointY) {
            handleMapTap({ 
              x: screenPointX, 
              y: screenPointY 
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
        <UserLocation
          showsUserHeadingIndicator={true}
        />
      </RNMapboxMapView>

      <LocateMeButton onPress={centerToUserLocation} />

      {/* Problem ActionSheet */}
      <Actionsheet 
        isOpen={viewProblem} 
        onClose={() => setViewProblem(false)} 
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="px-4 pb-8 pt-0 bg-white dark:bg-gray-900 rounded-t-3xl">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          {problem && (
            <ProblemView
              problem={problem}
              onClose={() => setViewProblem(false)}
            />
          )}
        </ActionsheetContent>
      </Actionsheet>

      {/* Circuit Navigation Buttons - only shown when a problem is displayed */}
      {viewProblem && problem && problem.order !== undefined && (
        <CircuitNavButtons
          onPrevious={showPreviousProblem}
          onNext={showNextProblem}
          problem={problem}
        />
      )}
    </View>
  );
} 