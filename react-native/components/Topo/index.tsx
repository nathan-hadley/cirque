import React, { useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { Image, ImageLoadEventData } from "expo-image";
import { CameraOff } from "lucide-react-native";
import { getTopoImage } from "@/assets/topo-image";
import { Center } from "@/components/ui/center";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { TopoLine } from "./TopoLine";

type TopoProps = {
  topo: string; // Topo key (e.g., "forestland-physical") or image URI
  remoteUri?: string; // Preferred R2 URL; falls back to the bundled asset on error
  line: number[][]; // Pixel coordinates (640×480)
  color?: string; // Line color (default: "#ff3333")
};

type ImageLayout = {
  width: number;
  height: number;
} | null;

/**
 * Topo component - displays a topo image with an animated line overlay
 * Used in both ProblemSheet and Contribute screens
 */
export function Topo({ topo, remoteUri, line, color = "#ff3333" }: TopoProps) {
  const [imageLayout, setImageLayout] = useState<ImageLayout>(null);
  const [originalImageSize, setOriginalImageSize] = useState<ImageLayout>(null);
  const [imageError, setImageError] = useState<boolean>(false);
  const [remoteFailed, setRemoteFailed] = useState<boolean>(false);

  // Prefer the R2 URL; on failure (e.g. offline, not yet downloaded) fall back
  // to the bundled asset when one exists for this topo slug.
  const localImage =
    topo.startsWith("http") || topo.startsWith("file")
      ? { uri: topo }
      : getTopoImage(topo) || (topo ? { uri: topo } : null);
  const topoImage = remoteUri && !remoteFailed ? { uri: remoteUri } : localImage;

  function handleImageLoad(event: ImageLoadEventData) {
    const { width, height } = event.source;
    if (width && height) {
      setOriginalImageSize({ width, height });
      setImageError(false);
    }
  }

  function handleImageError() {
    if (remoteUri && !remoteFailed && localImage) {
      setRemoteFailed(true); // retry with the bundled asset
      return;
    }
    setImageError(true);
  }

  function handleImageLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setImageLayout({ width, height });
  }

  const shouldRenderLine = originalImageSize && imageLayout && line && line.length > 0;

  if (!topoImage || imageError) {
    return (
      <Center className="flex-1 items-center">
        <Icon as={CameraOff} size="xl" className="text-typography-900" />
        <Text className="text-typography-900">
          {imageError ? "Failed to load image" : "No topo"}
        </Text>
      </Center>
    );
  }

  return (
    <>
      <Image
        source={topoImage}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        onLoad={handleImageLoad}
        onLayout={handleImageLayout}
        onError={handleImageError}
        cachePolicy="memory-disk"
        recyclingKey={topo}
      />

      {shouldRenderLine && (
        <TopoLine
          line={line}
          color={color}
          originalImageSize={originalImageSize}
          displayedImageSize={imageLayout}
        />
      )}
    </>
  );
}
