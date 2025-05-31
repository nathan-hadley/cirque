import { Heading } from '@/components/ui/heading';
import React from 'react';
import { View } from 'react-native';
import { Problem } from './problems';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { MapPinIcon } from 'lucide-react-native';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Info({ problem }: { problem: Problem }) {
  const { bottom } = useSafeAreaInsets();

  return (
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
  );
}
