import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { Button, ButtonIcon } from '../ui/button';
import { HStack } from '../ui/hstack';

type CircuitNavButtonsProps = {
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
};

export function CircuitNavButtons({ onPrevious, onNext, className }: CircuitNavButtonsProps) {
  return (
    <HStack className={`justify-between w-full px-4 ${className}`}>
      <Button onPress={onPrevious} className="bg-typography-0 rounded-full w-12 h-12">
        <ButtonIcon as={ChevronLeftIcon} size="lg" className="text-blue-500" />
      </Button>

      <Button onPress={onNext} className="bg-typography-0 rounded-full w-12 h-12">
        <ButtonIcon as={ChevronRightIcon} size="lg" className="text-blue-500" />
      </Button>
    </HStack>
  );
}
