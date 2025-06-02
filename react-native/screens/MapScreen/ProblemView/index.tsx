import React from 'react';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { Topo } from './Topo/index';
import { VStack } from '@/components/ui/vstack';
import { ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet';
import { MapPinIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProblemViewProps {
  problem: Problem;
}

export function ProblemView({ problem }: ProblemViewProps) {
  if (!problem) return null;

  const { bottom } = useSafeAreaInsets();

  return (
    <VStack className="gap-1">
      <ActionsheetDragIndicatorWrapper className="pt-0">
        <Topo problem={problem} />
      </ActionsheetDragIndicatorWrapper>
      <ScrollView showsVerticalScrollIndicator={true} className="mb-12">
        <VStack className="p-2 gap-1" style={{ paddingBottom: bottom }}>
          <HStack className="items-center gap-2">
            <View style={{ backgroundColor: problem.color }} className="w-4 h-4 rounded-full" />
            <Heading size="lg">{problem.name || 'Unnamed Problem'}</Heading>
          </HStack>

          <HStack className="items-center gap-2 pb-2">
            {problem.grade && <Text className="text-md font-medium">{problem.grade}</Text>}
            {problem.subarea && (
              <HStack className="items-center gap-1">
                <Icon as={MapPinIcon} size="xs" className="text-gray-500" />
                <Text className="text-typography-700">{problem.subarea}</Text>
              </HStack>
            )}
          </HStack>

          {problem.description && <Text>{problem.description}</Text>}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
