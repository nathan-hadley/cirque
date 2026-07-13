import { useEffect, useRef } from "react";
import { View } from "react-native";
import { MapPinIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircuitNavButtons } from "@/components/buttons/CircuitNavButtons";
import { Topo } from "@/components/Topo";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Sheet, type SheetRef } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { topoImageUrl } from "@/constants/api";
import { Problem } from "@/models/problems";

type ProblemSheetProps = {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
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
        {problem.order && <Text className="text-typography-700">#{problem.order}</Text>}
        {problem.status === "pending" && (
          <View className="rounded-full bg-warning-100 border border-warning-300 px-2 py-0.5">
            <Text className="text-warning-700 text-xs font-medium">Pending review</Text>
          </View>
        )}
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

export function ProblemSheet({ problem, isOpen, onClose }: ProblemSheetProps) {
  const sheet = useRef<SheetRef>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen && problem) {
      wasOpen.current = true;
      sheet.current?.present().catch((e: unknown) => console.error("Sheet present failed", e));
    } else if (wasOpen.current) {
      wasOpen.current = false;
      sheet.current?.dismiss().catch((e: unknown) => console.error("Sheet dismiss failed", e));
    }
  }, [isOpen, problem]);

  function handleDidDismiss() {
    wasOpen.current = false;
    onClose();
  }

  if (!problem) return null;

  return (
    <Sheet ref={sheet} detents={[0.5, 1]} dimmed={false} scrollable onDidDismiss={handleDidDismiss}>
      <View className="w-full aspect-[4/3] overflow-hidden bg-typography-300 relative">
        <Topo
          topo={problem.topo || ""}
          remoteUri={topoImageUrl(problem.topoKey, "full")}
          line={problem.line}
          color={problem.color}
        />
        {problem.order !== undefined && (
          <View className="absolute inset-0 justify-center">
            <CircuitNavButtons />
          </View>
        )}
      </View>
      <ProblemDescription problem={problem} />
    </Sheet>
  );
}
