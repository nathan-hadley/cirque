import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { MapPinIcon, XIcon } from 'lucide-react-native';
import { Problem } from '@/components/ProblemView/problems';
import { InfoView } from './InfoView';

interface ProblemViewProps {
  problem: Problem;
  onClose: () => void;
}

export function ProblemView({ problem, onClose }: ProblemViewProps) {
  if (!problem) return null;

  return (
    <View className="w-full">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <View style={{ backgroundColor: problem.color }} className="w-4 h-4 rounded-full" />
          <Heading size="lg">{problem.name || 'Unnamed Problem'}</Heading>
        </View>
      </View>

      <View className="mb-4">
        <View className="flex-row items-center gap-2 mb-2">
          {problem.grade && <Text className="text-lg font-medium">{problem.grade}</Text>}
          {problem.subarea && (
            <View className="flex-row items-center">
              <Icon as={MapPinIcon} size="xs" className="text-gray-500 mr-1" />
              <Text className="text-gray-500">{problem.subarea}</Text>
            </View>
          )}
        </View>

        {problem.description && (
          <Text className="text-gray-700 dark:text-gray-300 mb-4">{problem.description}</Text>
        )}
      </View>

      <InfoView problem={problem} />
    </View>
  );
}
