import React, { useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Image, ImageLoadEventData } from "expo-image";
import { Problem } from "@/models/problems";
import { getTopoImage } from "./topoImage";
import { CameraOff } from "lucide-react-native";
import { Center } from "@/components/ui/center";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { CircuitNavButtons } from "@/components/buttons/CircuitNavButtons";
import { TopoLine } from "./TopoLine";

type TopoProps = {
  problem: Problem;
};

type ImageLayout = {
  width: number;
  height: number;
} | null;

export function Topo({ problem }: TopoProps) {
  const [imageLayout, setImageLayout] = useState<ImageLayout>(null);
  const [originalImageSize, setOriginalImageSize] = useState<ImageLayout>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  const topoImage = getTopoImage(problem.topo);

  function handleImageLoad(event: ImageLoadEventData) {
    const { width, height } = event.source;
    if (width && height) {
      setOriginalImageSize({ width, height });
      setImageError(false);
    }
  }

  function handleImageError() {
    setImageError(true);
  }

  function handleImageLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setImageLayout({ width, height });
  }

  const shouldRenderLine =
    originalImageSize && imageLayout && problem.line && problem.line.length > 0;

  return (
    <View className="w-full aspect-[4/3] rounded-t-3xl overflow-hidden bg-typography-300 relative">
      {topoImage && !imageError ? (
        <>
          <Image
            source={topoImage}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            onLoad={handleImageLoad}
            onLayout={handleImageLayout}
            onError={handleImageError}
            cachePolicy="memory-disk"
            recyclingKey={`${problem.id}-${problem.topo}`}
          />

          {shouldRenderLine && (
            <TopoLine
              key={problem.id}
              problem={problem}
              originalImageSize={originalImageSize}
              displayedImageSize={imageLayout}
            />
          )}
        </>
      ) : (
        <Center className="flex-1 items-center">
          <Icon as={CameraOff} size="xl" className="text-typography-900" />
          <Text className="text-typography-900">
            {imageError ? "Failed to load image" : "No topo"}
          </Text>
        </Center>
      )}

      {problem.order !== undefined && (
        <View className="absolute inset-0 justify-center">
          <CircuitNavButtons />
        </View>
      )}
    </View>
  );
}
