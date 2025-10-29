import React, { useCallback, useEffect, useState } from "react";
import { Modal, View } from "react-native";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import {
  convertNormalizedToPixels,
  downsamplePoints,
  type NormalizedPoint,
} from "@/services/imageService";
import { ImageDrawingCanvas } from "./ImageDrawingCanvas";

type ImageDrawingModalProps = {
  isOpen: boolean;
  imageUri: string;
  onClose: () => void;
  onConfirm: (pixelPoints: number[][]) => void; // Returns downsampled pixel coordinates (640x480)
};

export function ImageDrawingModal({
  isOpen,
  imageUri,
  onClose,
  onConfirm,
}: ImageDrawingModalProps) {
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState<NormalizedPoint[]>([]);
  const [resetKey, setResetKey] = useState(0);

  // Reset points when modal opens
  useEffect(() => {
    if (isOpen) {
      setPoints([]);
    }
  }, [isOpen]);

  const handleChangePoints = useCallback((pts: NormalizedPoint[]) => {
    queueMicrotask(() => {
      setPoints(pts);
    });
  }, []);

  const handleClearLine = useCallback(() => {
    setPoints([]);
    setResetKey(k => k + 1);
  }, []);

  const handleConfirm = useCallback(() => {
    // Downsample to max 10 points, then convert to pixel coordinates
    const downsampled = downsamplePoints(points, 10);
    const pixelCoords = convertNormalizedToPixels(downsampled);
    onConfirm(pixelCoords);
  }, [points, onConfirm]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal visible={isOpen} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <View className="flex-1 bg-black/90">
        <View className="px-4 py-3 items-end" style={{ paddingTop: insets.top + 12 }}>
          <Button variant="link" onPress={handleClose} className="px-0">
            <ButtonIcon as={X} className="text-white w-8 h-8" />
          </Button>
        </View>

        {/* Image and Canvas - 4:3 aspect ratio */}
        <View className="flex-1 items-center justify-center gap-4">
          <View className="w-full" style={{ aspectRatio: 4 / 3 }}>
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            <View className="absolute inset-0">
              <ImageDrawingCanvas
                onChangePoints={handleChangePoints}
                resetKey={resetKey}
                initialPoints={points}
              />
            </View>
          </View>
          <Text className="text-typography-900 text-center">
            Begin the route line at the approximate location of the start holds and end it at the
            top of the boulder.
          </Text>
        </View>

        {/* Footer Buttons */}
        <View className="px-4 py-4" style={{ paddingBottom: insets.bottom + 16 }}>
          <HStack space="md">
            <Button onPress={handleClearLine} action="negative" className="flex-1">
              <ButtonText>Clear Line</ButtonText>
            </Button>
            <Button onPress={handleConfirm} action="positive" className="flex-1">
              <ButtonText>Done</ButtonText>
            </Button>
          </HStack>
        </View>
      </View>
    </Modal>
  );
}
