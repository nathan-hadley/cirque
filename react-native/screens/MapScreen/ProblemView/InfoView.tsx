import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { getTopoImage, topoImages } from './topos';

interface InfoViewProps {
  problem: Problem;
}

export function InfoView({ problem }: InfoViewProps) {
  // Debug logging
  console.log('Problem topo value:', problem.topo);
  console.log('Available topo keys:', Object.keys(topoImages));
  
  // Return early if we don't have a topo image to display
  if (!problem.topo) {
    return (
      <View className="mt-2">
        <Text className="text-gray-500 italic">No additional information available.</Text>
      </View>
    );
  }

  const topoImage = getTopoImage(problem.topo);
  console.log('Topo image result:', topoImage);
  
  // Return early if the topo image is not found
  if (!topoImage) {
    return (
      <View className="mt-2">
        <Text className="text-gray-500 italic">Topo image not found.</Text>
      </View>
    );
  }

  // Otherwise, display the topo image with the problem line
  return (
    <View className="mt-2">
      <Text className="text-lg font-medium mb-2">Topo</Text>
      
      <View className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        <Image
          source={topoImage}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* If we have line data and wanted to overlay it on the topo image,
            we could implement an SVG overlay here with react-native-svg */}
      </View>
    </View>
  );
} 