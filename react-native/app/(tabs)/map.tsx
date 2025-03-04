import { StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { useEffect, useState, useRef } from 'react';
import { useLocation } from '../../services/LocationService';
import { MapControls } from '../../components/MapControls';
import { ThemedView } from '../../components/ThemedView';
import { Config } from '../../constants/Config';

function MapScreen() {
  const { location } = useLocation();
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    if (location && isFollowingUser && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: Config.DEFAULT_ZOOM_LEVEL,
        animationDuration: 1000,
      });
    }
  }, [location, isFollowingUser]);

  const handleLocateMe = () => {
    if (location && cameraRef.current) {
      setIsFollowingUser(!isFollowingUser);
      cameraRef.current.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: Config.DEFAULT_ZOOM_LEVEL,
        animationDuration: 1000,
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Config.MAP_STYLE_URL}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={Config.DEFAULT_ZOOM_LEVEL}
          centerCoordinate={Config.DEFAULT_COORDINATES}
        />
      </Mapbox.MapView>
      {isMapReady && <MapControls onLocateMe={handleLocateMe} isFollowingUser={isFollowingUser} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;
