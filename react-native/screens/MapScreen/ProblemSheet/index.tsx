import React from "react";
import { Problem } from "@/models/problems";
import { Topo } from "./Topo/index";
import { VStack } from "@/components/ui/vstack";
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetDragIndicatorWrapper,
  ActionsheetScrollView,
} from "@/components/ui/actionsheet";
import { MapPinIcon } from "lucide-react-native";
import { Platform, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProblemSheetProps = React.ComponentProps<typeof Actionsheet> & {
  problem: Problem | null;
};

function ProblemDescription({ problem }: { problem: Problem }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <VStack className="self-start p-4 gap-1" style={{ paddingBottom: bottom }}>
      <HStack className="items-center gap-2">
        <View
          style={{ backgroundColor: problem.color }}
          className={`w-4 h-4 rounded-full ${problem.color !== "FFFFFF" ? "border border-typography-200" : ""}`}
        />
        <Heading size="lg">{problem.name || "Unnamed Problem"}</Heading>
        <Text className="text-typography-700">#{problem.order}</Text>
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
      <View className="h-4" />
    </VStack>
  );
}

export function ProblemSheet({ problem, ...props }: ProblemSheetProps) {
  if (!problem) return null;

  return (
    <Actionsheet className="gap-1" {...props}>
      <ActionsheetContent className="p-0">
        <ActionsheetDragIndicatorWrapper className="pt-0">
          <Topo problem={problem} />
        </ActionsheetDragIndicatorWrapper>
        {/* The ScrollView doesn't work well on Android,
        so we are letting the Actionsheet resize itself. */}
        {Platform.OS === "ios" ? (
          <ActionsheetScrollView showsVerticalScrollIndicator={true}>
            <ProblemDescription problem={problem} />
          </ActionsheetScrollView>
        ) : (
          <ProblemDescription problem={problem} />
        )}
      </ActionsheetContent>
    </Actionsheet>
  );
}
