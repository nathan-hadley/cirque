import React, { useState } from "react";
import { View } from "react-native";
import { Camera, CircleIcon, ImageIcon, Pencil } from "lucide-react-native";
import { Topo } from "@/components/Topo";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from "@/components/ui/radio";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import {
  captureFromCamera,
  PickedImage,
  pickFromLibrary,
  requestCameraPermission,
  requestMediaLibraryPermission,
} from "@/services/imageService";
import ProblemPicker, { getTopoUri } from "./ProblemPicker";
import { FieldError } from "./validation";

export type TopoData = {
  selectedTopoKey: string | null;
  selectedTopoUri: string | null;
  pickedImage: PickedImage | null;
  linePixels: [number, number][]; // Pixel coordinates as [x, y] tuples (already downsampled to max 10 points)
};

type TopoPickerProps = {
  value: TopoData;
  onChange: (data: TopoData) => void;
  onOpenDrawingModal: () => void;
  error?: string;
};

export default function TopoPicker({
  value,
  onChange,
  onOpenDrawingModal,
  error,
}: TopoPickerProps) {
  const showToast = useSimpleToast();
  const [topoSource, setTopoSource] = useState<"existing" | "new">("new");
  const [isProblemPickerOpen, setIsProblemPickerOpen] = useState(false);

  const handleTopoSourceChange = (newSource: string) => {
    setTopoSource(newSource as "existing" | "new");
    // Clear all when switching
    onChange({
      selectedTopoKey: null,
      selectedTopoUri: null,
      pickedImage: null,
      linePixels: [],
    });
  };

  const handleProblemSelect = async (topoKey: string | null, problemName: string) => {
    setIsProblemPickerOpen(false);

    // Check if problem has a topo
    if (!topoKey) {
      showToast({
        action: "warning",
        message: `"${problemName}" doesn't have a topo image yet. Please upload a new photo instead.`,
      });
      return;
    }

    // Load the topo URI
    try {
      const uri = await getTopoUri(topoKey);
      if (uri) {
        onChange({
          selectedTopoKey: topoKey,
          selectedTopoUri: uri,
          pickedImage: null,
          linePixels: [],
        });
      }
    } catch (e) {
      showToast({
        action: "error",
        message: "Failed to load topo image.",
      });
    }
  };

  const handlePickImage = async () => {
    try {
      await requestMediaLibraryPermission();
      const img = await pickFromLibrary();
      if (img) {
        onChange({
          selectedTopoKey: null,
          selectedTopoUri: null,
          pickedImage: img,
          linePixels: [],
        });
      }
    } catch (e) {
      showToast({
        action: "error",
        message: "Failed to pick image. Please try again.",
      });
    }
  };

  const handleCaptureImage = async () => {
    try {
      await requestCameraPermission();
      const img = await captureFromCamera();
      if (img) {
        onChange({
          selectedTopoKey: null,
          selectedTopoUri: null,
          pickedImage: img,
          linePixels: [],
        });
      }
    } catch (e) {
      showToast({
        action: "error",
        message: "Failed to capture image. Please try again.",
      });
    }
  };

  const currentImageUri =
    topoSource === "existing" ? value.selectedTopoUri : value.pickedImage?.uri;

  return (
    <>
      <VStack space="lg" className="px-6">
        <Text className="text-typography-700 font-semibold">Topo Image & Line</Text>
        <Text className="text-typography-600">Add a photo and draw the route line.</Text>

        <RadioGroup value={topoSource} onChange={handleTopoSourceChange}>
          <VStack space="sm">
            <Radio value="existing">
              <RadioIndicator>
                <RadioIcon as={CircleIcon} />
              </RadioIndicator>
              <RadioLabel>Use existing problem's topo</RadioLabel>
            </Radio>
            <Radio value="new">
              <RadioIndicator>
                <RadioIcon as={CircleIcon} />
              </RadioIndicator>
              <RadioLabel>Upload new photo</RadioLabel>
            </Radio>
          </VStack>
        </RadioGroup>

        {topoSource === "existing" ? (
          <Button onPress={() => setIsProblemPickerOpen(true)} variant="outline">
            <ButtonIcon as={ImageIcon} />
            <ButtonText>{value.selectedTopoKey ? "Change Problem" : "Select Problem"}</ButtonText>
          </Button>
        ) : (
          <HStack space="md">
            <Button onPress={handlePickImage} variant="outline" className="flex-1">
              <ButtonIcon as={ImageIcon} />
              <ButtonText>Select Photo</ButtonText>
            </Button>
            <Button onPress={handleCaptureImage} variant="outline" className="flex-1">
              <ButtonIcon as={Camera} />
              <ButtonText>Camera</ButtonText>
            </Button>
          </HStack>
        )}

        {currentImageUri && (
          <VStack space="md">
            <View className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-typography-300">
              <Topo topo={currentImageUri} line={value.linePixels} />
            </View>
            <Button onPress={onOpenDrawingModal} action="primary" variant="outline">
              <ButtonIcon as={Pencil} />
              <ButtonText>{value.linePixels.length > 0 ? "Edit Line" : "Draw Line"}</ButtonText>
            </Button>
          </VStack>
        )}
        {error && <FieldError message={error} />}
      </VStack>

      <ProblemPicker
        isOpen={isProblemPickerOpen}
        onClose={() => setIsProblemPickerOpen(false)}
        onSelect={handleProblemSelect}
        currentTopo={value.selectedTopoKey || undefined}
      />
    </>
  );
}
