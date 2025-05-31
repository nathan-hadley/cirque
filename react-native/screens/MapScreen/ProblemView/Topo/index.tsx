import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { getTopoImage } from './topos';

interface TopoProps {
  problem: Problem;
}

export function Topo({ problem }: TopoProps) {
  const topoImage = getTopoImage(problem.topo);

  if (!topoImage) {
    return <Text className="pt-2 text-gray-500 italic">Topo image not found.</Text>;
  }

  return (
    <View className="relative w-full aspect-[4/3] overflow-hidden rounded-t-3xl">
      <Image source={topoImage} className="w-full h-full" resizeMode="cover" />

      {/* If we have line data and wanted to overlay it on the topo image,
            we could implement an SVG overlay here with react-native-svg */}
    </View>
  );
}
