import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';

type MapSearchBarProps = {
  onPress: () => void;
};

export function MapSearchBar({ onPress }: MapSearchBarProps) {
  const insets = useSafeAreaInsets();
  
  const topOffset = Platform.OS === 'ios' ? insets.top + 8 : insets.top + 16;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute left-4 right-4 bg-white rounded-lg shadow-md"
      style={{ 
        top: topOffset,
        elevation: Platform.OS === 'android' ? 8 : undefined,
      }}
    >
      <HStack space="sm" className="items-center px-4 py-3">
        <Search size={20} color="#6b7280" />
        <Text className="flex-1 text-gray-500">
          Search problems...
        </Text>
      </HStack>
    </TouchableOpacity>
  );
}