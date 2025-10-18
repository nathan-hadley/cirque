import React, { useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Image } from "expo-image";
import { Button, ButtonText } from "@/components/ui/button";
import { ImageDrawingCanvas, NormalizedPoint } from "./ImageDrawingCanvas";
import { captureFromCamera, pickFromLibrary, PickedImage } from "@/services/imageService";

export default function ContributeImageAndDrawing() {
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [normalizedPoints, setNormalizedPoints] = useState<NormalizedPoint[]>([]);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const handlePick = useCallback(async () => {
    try {
      const img = await pickFromLibrary();
      if (img) {
        setPickedImage(img);
        setNormalizedPoints([]);
        setResetKey((k) => k + 1);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleCapture = useCallback(async () => {
    try {
      const img = await captureFromCamera();
      if (img) {
        setPickedImage(img);
        setNormalizedPoints([]);
        setResetKey((k) => k + 1);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const onChangePoints = useCallback((pts: NormalizedPoint[]) => {
    setNormalizedPoints(pts);
  }, []);

  const onClear = useCallback(() => {
    setNormalizedPoints([]);
    setResetKey((k) => k + 1);
  }, []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    const height = Math.round((width * 3) / 4); // 4:3 aspect for preview
    setDisplaySize({ width, height });
  }, []);

  return (
    <View className="flex-1 p-4 gap-3" onLayout={onLayout}>
      <View className="flex-row gap-3">
        <Button onPress={handlePick} action="primary" variant="solid">
          <ButtonText>Select Photo</ButtonText>
        </Button>
        <Button onPress={handleCapture} action="secondary" variant="outline">
          <ButtonText>Camera</ButtonText>
        </Button>
        <Button onPress={onClear} action="negative" variant="outline" disabled={!pickedImage}>
          <ButtonText>Clear Line</ButtonText>
        </Button>
      </View>

      <View className="w-full rounded-xl overflow-hidden bg-typography-300" style={{ height: displaySize?.height }}>
        {pickedImage && displaySize && (
          <>
            <Image
              source={{ uri: pickedImage.uri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            <View className="absolute inset-0">
              <ImageDrawingCanvas
                imageUri={pickedImage.uri}
                imageNaturalSize={{ width: pickedImage.width, height: pickedImage.height }}
                onChangePoints={onChangePoints}
                onClear={onClear}
                resetKey={resetKey}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}
