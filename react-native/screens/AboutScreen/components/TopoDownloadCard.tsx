import React from "react";
import { View } from "react-native";
import { CheckCircle, ImageDown } from "lucide-react-native";
import { CircularProgress } from "@/components/CircularProgress";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type TopoDownloadCardProps = {
  downloading: boolean;
  progress: number;
  done: boolean;
  onDownload: () => void;
};

export function TopoDownloadCard({
  downloading,
  progress,
  done,
  onDownload,
}: TopoDownloadCardProps) {
  return (
    <View className="bg-background-50 border border-outline-200 rounded-2xl p-6">
      <VStack space="md">
        <HStack space="md" className="items-center">
          {done ? (
            <Icon as={CheckCircle} size="xl" className="text-green-600" />
          ) : (
            <Icon as={ImageDown} size="xl" className="text-blue-600" />
          )}
          <VStack className="flex-1">
            <Text className="font-semibold text-lg">
              {done ? "Topo Images Downloaded" : "Download Topo Images"}
            </Text>
            <Text className="text-sm text-typography-600">
              {done
                ? "All topo photos ready for offline use"
                : "Save all topo photos (~20 MB) for offline use"}
            </Text>
          </VStack>
        </HStack>

        <Button
          onPress={onDownload}
          disabled={downloading}
          action="positive"
          className="rounded-xl"
          size="lg"
        >
          <HStack space="sm" className="items-center">
            {downloading ? (
              <CircularProgress progress={progress} />
            ) : (
              <ButtonIcon as={ImageDown} size="sm" className="text-white" />
            )}
            <ButtonText className="text-white font-semibold">
              {downloading ? "Downloading..." : done ? "Re-download Topos" : "Download Topos"}
            </ButtonText>
          </HStack>
        </Button>
      </VStack>
    </View>
  );
}
