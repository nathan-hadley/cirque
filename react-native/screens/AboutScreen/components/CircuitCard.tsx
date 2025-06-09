import React from 'react';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

interface CircuitCardProps {
  title: string;
  difficulty: string;
  color: string;
}

export function CircuitCard({ title, difficulty, color }: CircuitCardProps) {
  return (
    <VStack className={`p-4 rounded-xl border-2 ${color}`} space="xs">
      <Text className="font-semibold text-typography-900">{title}</Text>
      <Text className="text-sm text-typography-600">{difficulty}</Text>
    </VStack>
  );
} 