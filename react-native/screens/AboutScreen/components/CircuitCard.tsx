import React from "react";
import { Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type CircuitCardProps = {
  title: string;
  difficulty: string;
  color: string;
  testID?: string;
  onPress?: () => void;
};

export function CircuitCard({ title, difficulty, color, testID, onPress }: CircuitCardProps) {
  return (
    <Pressable testID={testID} onPress={onPress}>
      <VStack className={`p-4 rounded-xl border-2 ${color}`} space="xs">
        <Text className="font-semibold text-typography-900">{title}</Text>
        <Text className="text-sm text-typography-600">{difficulty}</Text>
      </VStack>
    </Pressable>
  );
}
