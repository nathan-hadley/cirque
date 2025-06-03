import React from 'react';
import { View, Image } from 'react-native';
import { Problem } from '@/models/problems';
import { getTopoImage } from './topos';
import { CameraOff } from 'lucide-react-native';
import { Center } from '@/components/ui/center';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CircuitNavButtons } from '@/components/buttons/CircuitNavButtons';

interface TopoProps {
  problem: Problem;
}

export function Topo({ problem }: TopoProps) {
  const topoImage = getTopoImage(problem.topo);

  return (
    <View className="w-full aspect-[4/3] rounded-t-3xl overflow-hidden bg-typography-300 relative">
      {topoImage ? (
        <Image source={topoImage} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Center className="flex-1 items-center">
          <Icon as={CameraOff} size="xl" className="text-typography-900" />
          <Text className="text-typography-900">No topo</Text>
        </Center>
      )}

      {problem.order !== undefined && (
        <View className="absolute inset-0 justify-center">
          <CircuitNavButtons />
        </View>
      )}
    </View>
  );
}
