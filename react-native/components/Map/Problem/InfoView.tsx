import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Problem } from '@/components/Map/Problem/problems';

interface InfoViewProps {
  problem: Problem;
}

export function InfoView({ problem }: InfoViewProps) {
  // Return early if we don't have a topo image to display
  if (!problem.topo) {
    return (
      <View className="mt-2">
        <Text className="text-gray-500 italic">No additional information available.</Text>
      </View>
    );
  }

  // Otherwise, display the topo image with the problem line
  return (
    <View className="mt-2">
      <Text className="text-lg font-medium mb-2">Topo</Text>
      
      <View className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        {problem.topo && (
          <Image
            source={{ uri: problem.topo }}
            className="w-full h-full"
            resizeMode="cover"
          />
        )}

        {/* If we have line data and wanted to overlay it on the topo image,
            we could implement an SVG overlay here with react-native-svg */}
      </View>
    </View>
  );
} 