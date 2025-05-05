import React from 'react';
import { Pressable } from 'react-native';
import { CompassIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

interface LocateMeButtonProps {
  onPress: () => void;
}

export function LocateMeButton({ onPress }: LocateMeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-24 right-4 bg-white dark:bg-gray-800 w-12 h-12 rounded-full items-center justify-center shadow-md"
    >
      <Icon as={CompassIcon} size="lg" className="text-blue-500" />
    </Pressable>
  );
} 