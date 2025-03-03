import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';

interface MapControlsProps {
  onLocateMe: () => void;
  isFollowingUser: boolean;
}

export function MapControls({ onLocateMe, isFollowingUser }: MapControlsProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor, borderColor: tintColor },
        ]}
        onPress={onLocateMe}
        activeOpacity={0.7}>
        <Ionicons
          name={isFollowingUser ? 'location' : 'location-outline'}
          size={24}
          color={isFollowingUser ? tintColor : textColor}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
