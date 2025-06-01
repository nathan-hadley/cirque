import React from 'react';
import { CompassIcon } from 'lucide-react-native';
import { Button, ButtonIcon } from '../ui/button';

interface LocateMeButtonProps {
  onPress: () => void;
  className?: string;
}

export function LocateMeButton({ onPress, className }: LocateMeButtonProps) {
  return (
    <Button onPress={onPress} className={`w-12 h-12 rounded-full bg-typography-0 ${className}`}>
      <ButtonIcon as={CompassIcon} size="lg" className="text-blue-500" />
    </Button>
  );
}
