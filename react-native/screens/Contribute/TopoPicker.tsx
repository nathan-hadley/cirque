import React, { useState } from "react";
import { View } from "react-native";
import { Camera, CircleIcon, ImageIcon, Pencil } from "lucide-react-native";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from "@/components/ui/radio";
import { Text } from "@/components/ui/text";
import { Toast, ToastDescription, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { Problem } from "@/models/problems";
import { Topo } from "@/screens/MapScreen/ProblemSheet/Topo";
import { captureFromCamera, PickedImage, pickFromLibrary } from "@/services/imageService";
import ProblemPicker, { getTopoUri } from "./ProblemPicker";

export type TopoData = {
  selectedTopoKey: string | null;
  selectedTopoUri: string | null;
  pickedImage: PickedImage | null;
  linePixels: number[][]; // Pixel coordinates (already downsampled to max 10 points)
};

type TopoPickerProps = {
  value: TopoData;
  onChange: (data: TopoData) => void;
  onOpenDrawingModal: () => void;
};

// Helper to create a mock Problem for the Topo component
function createMockProblem(imageUri: string, linePixels: number[][]): Problem {
  return {
    id: "preview",
    name: "Preview",
    grade: "V0",
    subarea: "",
    colorStr: "red",
    color: "#ff3333",
    line: linePixels,
    topo: imageUri,
  };
}

export default function TopoPicker({ value, onChange, onOpenDrawingModal }: TopoPickerProps) {
  const toast = useToast();
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
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="warning">
            <ToastTitle>No Topo Available</ToastTitle>
            <ToastDescription>
              "{problemName}" doesn't have a topo image yet. Please upload a new photo instead.
            </ToastDescription>
          </Toast>
        ),
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
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Failed to load topo image.</ToastDescription>
          </Toast>
        ),
      });
    }
  };

  const handlePickImage = async () => {
    try {
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
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Failed to pick image. Please try again.</ToastDescription>
          </Toast>
        ),
      });
    }
  };

  const handleCaptureImage = async () => {
    try {
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
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Failed to capture image. Please try again.</ToastDescription>
          </Toast>
        ),
      });
    }
  };

  return (
    <>
      <VStack space="lg" className="px-6">
        <Text className="text-typography-700 font-semibold">Topo Image & Line (optional)</Text>
        <Text className="text-typography-600">
          Add a photo and draw the line to help others find this problem.
        </Text>

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
          <VStack space="md">
            <Button onPress={() => setIsProblemPickerOpen(true)} variant="outline">
              <ButtonIcon as={ImageIcon} />
              <ButtonText>{value.selectedTopoKey ? "Change Problem" : "Select Problem"}</ButtonText>
            </Button>
            {value.selectedTopoUri && (
              <VStack space="md">
                <View>
                  <Topo
                    problem={createMockProblem(value.selectedTopoUri, value.linePixels)}
                    imageUri={value.selectedTopoUri}
                    hideCircuitButtons={true}
                  />
                </View>
                <Button onPress={onOpenDrawingModal} action="primary" variant="outline">
                  <ButtonIcon as={Pencil} />
                  <ButtonText>{value.linePixels.length > 0 ? "Edit Line" : "Draw Line"}</ButtonText>
                </Button>
              </VStack>
            )}
          </VStack>
        ) : (
          <VStack space="md">
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
            {value.pickedImage && (
              <VStack space="md">
                <View>
                  <Topo
                    problem={createMockProblem(value.pickedImage.uri, value.linePixels)}
                    imageUri={value.pickedImage.uri}
                    hideCircuitButtons={true}
                  />
                </View>
                <Button onPress={onOpenDrawingModal} action="primary" variant="outline">
                  <ButtonIcon as={Pencil} />
                  <ButtonText>{value.linePixels.length > 0 ? "Edit Line" : "Draw Line"}</ButtonText>
                </Button>
              </VStack>
            )}
          </VStack>
        )}
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
