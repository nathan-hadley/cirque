import React, { useState } from "react";
import { LayoutChangeEvent, Platform, View } from "react-native";
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
  const [imageError, setImageError] = useState<string | null>(null);

  const topoImage = getTopoImage(problem.topo);

  // Reset state when problem changes to prevent stale states
  React.useEffect(() => {
    setImageLayout(null);
    setOriginalImageSize(null);
    setImageError(null);

    // Debug logging for iOS image loading issues
    if (Platform.OS === 'ios' && problem.subarea === 'Swiftwater') {
      console.log(`[iOS Debug] Loading image for: ${problem.name} (${problem.topo})`);
      console.log(`[iOS Debug] Image exists: ${!!topoImage}`);
      if (topoImage) {
        console.log(`[iOS Debug] Image source: ${JSON.stringify(topoImage)}`);
      }
    }
  }, [problem.id, problem.topo, problem.name, problem.subarea, topoImage]);

  function handleImageLoad(event: ImageLoadEventData) {
    const { width, height } = event.source;
    if (width && height) {
      setOriginalImageSize({ width, height });
      setImageError(null); // Clear any previous errors

      // iOS debug logging
      if (Platform.OS === 'ios' && problem.subarea === 'Swiftwater') {
        console.log(`[iOS Debug] Image loaded successfully: ${problem.name} - ${width}x${height}`);
      }
    }
  }

  function handleImageError(error: unknown) {
    const errorMessage = `Failed to load image for ${problem.name} (${problem.topo})`;
    setImageError(errorMessage);

    // Enhanced error logging for iOS Swiftwater issues
    if (Platform.OS === 'ios' && problem.subarea === 'Swiftwater') {
      console.error(`[iOS Error] ${errorMessage}`, error);
      console.error(`[iOS Error] Problem details:`, {
        id: problem.id,
        name: problem.name,
        topo: problem.topo,
        subarea: problem.subarea,
        topoImageExists: !!topoImage,
      });
    }
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
            // Add retry and cache strategies for iOS
            cachePolicy={Platform.OS === 'ios' ? 'memory-disk' : 'disk'}
            recyclingKey={`${problem.id}-${problem.topo}`}
          />

          {shouldRenderLine && (
            <TopoLine
              key={`${problem.id}-${problem.topo}`}
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
            {imageError ? 'Failed to load image' : 'No topo'}
          </Text>
          {imageError && Platform.OS === 'ios' && (
            <Text className="text-xs text-typography-600 mt-2 px-4 text-center">{imageError}</Text>
          )}
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
