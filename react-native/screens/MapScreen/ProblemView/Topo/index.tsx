import React from 'react';
import { View, Image } from 'react-native';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { getTopoImage } from './topos';
import { CameraOff } from 'lucide-react-native';
import { Center } from '@/components/ui/center';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

interface TopoProps {
  problem: Problem;
}

export function Topo({ problem }: TopoProps) {
  const topoImage = getTopoImage(problem.topo);

  return (
    <View className="relative w-full aspect-[4/3] rounded-t-3xl overflow-hidden bg-typography-300">
      {topoImage ? (
        <Image source={topoImage} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Center className="flex-1 items-center">
          <Icon as={CameraOff} size="xl" className="text-typography-900" />
          <Text className="text-typography-900">No topo</Text>
        </Center>
      )}

      {/* If we have line data and wanted to overlay it on the topo image,
            we could implement an SVG overlay here with react-native-svg */}
    </View>
  );
}
