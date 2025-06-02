import React from 'react';
import { View, Image, ImageBackground } from 'react-native';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { getTopoImage } from './topos';
import { CameraOff } from 'lucide-react-native';
import { Center } from '@/components/ui/center';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CircuitNavButtons } from '@/components/buttons/CircuitNavButtons';
import { useMapContext } from '@/contexts/MapContext';

interface TopoProps {
  problem: Problem;
}

export function Topo({ problem }: TopoProps) {
  const topoImage = getTopoImage(problem.topo);
  const { showPreviousProblem, showNextProblem } = useMapContext();

  if (!topoImage) {
    return (
      <View className="w-full aspect-[4/3] rounded-t-3xl overflow-hidden bg-typography-300">
        <Center className="flex-1 items-center">
          <Icon as={CameraOff} size="xl" className="text-typography-900" />
          <Text className="text-typography-900">No topo</Text>
        </Center>
      </View>
    );
  }

  return (
    <View className="w-full aspect-[4/3] rounded-t-3xl overflow-hidden">
      <ImageBackground 
        source={topoImage} 
        className="flex-1 justify-center"
        resizeMode="cover"
      >
        {problem.order !== undefined && (
          <CircuitNavButtons
            onPrevious={showPreviousProblem}
            onNext={showNextProblem}
          />
        )}
      </ImageBackground>

      {/* If we have line data and wanted to overlay it on the topo image,
            we could implement an SVG overlay here with react-native-svg */}
    </View>
  );
}
