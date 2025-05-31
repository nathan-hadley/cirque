import React from 'react';
import { View, Pressable } from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { Icon } from '@/components/ui/icon';

interface CircuitNavButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  problem: Problem;
}

export function CircuitNavButtons({ onPrevious, onNext, problem }: CircuitNavButtonsProps) {
  const getCircuitName = () => {
    const { colorStr, subarea } = problem;
    if (!subarea) return `${capitalize(colorStr)} Circuit`;
    return `${subarea} ${capitalize(colorStr)} Circuit`;
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <View className="absolute bottom-6 left-0 right-0 flex-row justify-between items-center px-4">
      <Pressable
        onPress={onPrevious}
        className="bg-white dark:bg-gray-800 rounded-full w-12 h-12 items-center justify-center shadow-md"
      >
        <Icon as={ChevronLeftIcon} size="lg" className="text-blue-500" />
      </Pressable>

      <View style={{ backgroundColor: problem.color }} className="px-4 py-2 rounded-full shadow-md">
        <Text
          className={`text-center font-medium ${problem.colorStr === 'black' || problem.colorStr === 'blue' ? 'text-white' : 'text-black'}`}
        >
          {getCircuitName()}
        </Text>
      </View>

      <Pressable
        onPress={onNext}
        className="bg-white dark:bg-gray-800 rounded-full w-12 h-12 items-center justify-center shadow-md"
      >
        <Icon as={ChevronRightIcon} size="lg" className="text-blue-500" />
      </Pressable>
    </View>
  );
}
