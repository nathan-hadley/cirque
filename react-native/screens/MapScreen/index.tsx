import React from 'react';
import { View } from 'react-native';
import Mapbox, { MapView as RNMapboxMapView, UserLocation, Camera } from '@rnmapbox/maps';
import {
  Actionsheet,
  ActionsheetContent,
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
      </RNMapboxMapView>

      <LocateMeButton onPress={centerToUserLocation} className="absolute bottom-28 right-4" />

      {viewProblem && problem && problem.order !== undefined && (
        <CircuitNavButtons
          onPrevious={showPreviousProblem}
          onNext={showNextProblem}
          className="absolute bottom-[55%] -translate-y-4"
        />
      )}

      {/* Problem ActionSheet */}
      <Actionsheet
        isOpen={viewProblem && problem !== null}
        onClose={() => setViewProblem(false)}
        closeOnOverlayClick={false}
        snapPoints={[55]}
      >
        {problem && <ProblemView problem={problem} />}
      </Actionsheet>
    </View>
  );
}
