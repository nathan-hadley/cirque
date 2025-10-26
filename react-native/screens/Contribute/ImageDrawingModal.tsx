import React, { useCallback, useEffect, useState } from "react";
import { Modal, View } from "react-native";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { downsamplePoints, type NormalizedPoint } from "@/services/imageService";
import { ImageDrawingCanvas } from "./ImageDrawingCanvas";

type ImageDrawingModalProps = {
  isOpen: boolean;
  imageUri: string;
  initialPoints: NormalizedPoint[];
  onClose: () => void;
  onConfirm: (points: NormalizedPoint[]) => void;
};

export function ImageDrawingModal({
  isOpen,
  imageUri,
  initialPoints,
  onClose,
  onConfirm,
}: ImageDrawingModalProps) {
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState<NormalizedPoint[]>(initialPoints);
  const [resetKey, setResetKey] = useState(0);

  // Sync points when modal opens with existing data
  useEffect(() => {
    if (isOpen) {
      setPoints(initialPoints);
    }
  }, [isOpen, initialPoints]);

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
    // Downsample to max 10 points for submission
    const downsampled = downsamplePoints(points, 10);
    onConfirm(downsampled);
  }, [points, onConfirm]);

  const handleClose = useCallback(() => {
    // Reset to initial points on cancel
    setPoints(initialPoints);
    onClose();
  }, [initialPoints, onClose]);

  return (
    <Modal visible={isOpen} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <View className="flex-1 bg-black/90">
        <View className="px-4 py-3 items-end" style={{ paddingTop: insets.top + 12 }}>
          <Button variant="link" onPress={handleClose} className="px-0">
            <ButtonIcon as={X} className="text-white w-8 h-8" />
          </Button>
        </View>

        {/* Image and Canvas - 4:3 aspect ratio */}
        <View className="flex-1 items-center justify-center">
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
