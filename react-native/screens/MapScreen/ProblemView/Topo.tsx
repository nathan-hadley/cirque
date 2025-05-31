import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { getTopoImage } from './topos';
import { VStack } from '@/components/ui/vstack';

interface TopoProps {
  problem: Problem;
}

export function Topo({ problem }: TopoProps) {
  const topoImage = getTopoImage(problem.topo);

  if (!topoImage) {
    return (
      <Text className="pt-2 text-gray-500 italic">Topo image not found.</Text>
    );
  }

  // Otherwise, display the topo image with the problem line
  return (
    <VStack>
      <Text className="text-lg font-medium py-2">Topo</Text>
      
      <View className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        <Image
          source={topoImage}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* If we have line data and wanted to overlay it on the topo image,
            we could implement an SVG overlay here with react-native-svg */}
      </View>
    </VStack>
  );
} 