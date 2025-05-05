import { View } from 'react-native';
import { CircuitMapView } from '@/components/Map/MapView';

export default function MapScreen() {
  return (
    <View className="flex-1">
      <CircuitMapView />
    </View>
  );
}
