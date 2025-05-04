import { View } from 'react-native';
import Mapbox, { Camera, MapView } from '@rnmapbox/maps';

Mapbox.setAccessToken(
  'pk.eyJ1IjoibmF0aGFuaGFkbGV5IiwiYSI6ImNsdzdmdXAxdDIycmoyanA3cXVvbHFxenQifQ.1wcBxvOkH8eU-6ev7SoO8Q'
);

export default function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        styleURL="mapbox://styles/nathanhadley/clw9fowlu01kw01obbpsp3wiq"
        compassEnabled={true}
        scaleBarEnabled={true}
      >
        <Camera
          centerCoordinate={[-120.713, 47.585]}
          zoomLevel={10.5}
          animationDuration={0}
        />
      </MapView>
    </View>
  );
}
