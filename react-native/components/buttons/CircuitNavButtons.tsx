import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { Button, ButtonIcon } from '../ui/button';
import { HStack } from '../ui/hstack';
import { useMapContext } from '@/hooks/useMapContext';

export function CircuitNavButtons() {
  const { problem, showPreviousProblem, showNextProblem } = useMapContext();

  const color = problem?.color ?? 'black';

  return (
    <HStack className={`justify-between w-full px-2`}>
      <Button
        onPress={showPreviousProblem}
        action="secondary"
        className="bg-typography-0/50 rounded-full w-12 h-12"
      >
        <ButtonIcon as={ChevronLeftIcon} size="lg" color={color} />
      </Button>

      <Button
        onPress={showNextProblem}
        action="secondary"
        className="bg-typography-0/50 rounded-full w-12 h-12"
      >
        <ButtonIcon as={ChevronRightIcon} size="lg" color={color} />
      </Button>
    </HStack>
  );
}
