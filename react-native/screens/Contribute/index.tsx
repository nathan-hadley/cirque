import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ChevronDown, MapPin } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BlurBackground from "@/components/BlurBackground";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastDescription, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { useSubmitProblem } from "@/hooks/useSubmitProblem";
import AreaPicker from "./AreaPicker";
import CoordinateInput from "./CoordinateInput";
import GradePicker from "./GradePicker";
import { ImageDrawingModal } from "./ImageDrawingModal";
import TopoPicker, { TopoData } from "./TopoPicker";
import { FieldError, FieldErrors, FieldName, getVisibleErrors, validateForm } from "./validation";

export default function ContributeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const toast = useToast();
  const submitMutation = useSubmitProblem();

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string | null>(null);
  const [subarea, setSubarea] = useState<string>("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [touched, setTouched] = useState<Set<FieldName>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Topo and image state
  const [topoData, setTopoData] = useState<TopoData>({
    selectedTopoKey: null,
    selectedTopoUri: null,
    pickedImage: null,
    linePixels: [],
  });
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);

  const errors = validateForm({
    contactName,
    contactEmail,
    name,
    grade,
    area: subarea,
    latitude,
    longitude,
    description,
    line: topoData.linePixels,
    topo: topoData.selectedTopoKey,
  });
  const visibleErrors = getVisibleErrors(errors, touched, submitAttempted);
  const isValid = Object.keys(errors).length === 0;

  const markTouched = (field: FieldName) => {
    setTouched(prev => new Set(prev).add(field));
  };

  const handleGradeSelect = (selectedGrade: string) => {
    setGrade(selectedGrade);
    setIsGradeOpen(false);
    markTouched("grade");
  };

  const handleOpenDrawingModal = () => {
    setIsDrawingModalOpen(true);
  };

  const handleCloseDrawingModal = () => {
    setIsDrawingModalOpen(false);
  };

  const handleConfirmDrawing = (pixelPoints: number[][]) => {
    setTopoData((prev: TopoData) => ({ ...prev, linePixels: pixelPoints }));
    setIsDrawingModalOpen(false);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!isValid) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error">
            <ToastTitle>Validation Error</ToastTitle>
            <ToastDescription>Please fill out all required fields correctly.</ToastDescription>
          </Toast>
        ),
      });
      return;
    }

    // Generate topo filename for new photos: area-problem-name
    let topoFilename = topoData.selectedTopoKey;
    if (!topoFilename && topoData.pickedImage) {
      const slugifiedArea = subarea.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const slugifiedName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      topoFilename = `${slugifiedArea}-${slugifiedName}`;
    }

    submitMutation.mutate(
      {
        contact: {
          name: contactName,
          email: contactEmail,
        },
        problem: {
          name,
          grade: grade!,
          subarea,
          ...(description.trim() && { description }),
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
          line: topoData.linePixels,
          ...(topoFilename && { topo: topoFilename }),
          ...(topoData.pickedImage?.base64 && { imageBase64: topoData.pickedImage.base64 }),
        },
      } as any,
      {
        onSuccess: () => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success">
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>
                  Problem submitted successfully! We'll review it shortly.
                </ToastDescription>
              </Toast>
            ),
          });
          // Reset form
          setContactName("");
          setContactEmail("");
          setName("");
          setGrade(null);
          setSubarea("");
          setDescription("");
          setLatitude("");
          setLongitude("");
          setTopoData({
            selectedTopoKey: null,
            selectedTopoUri: null,
            pickedImage: null,
            linePixels: [],
          });
          setTouched(new Set());
          setSubmitAttempted(false);
        },
        onError: error => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="error">
                <ToastTitle>Submission Failed</ToastTitle>
                <ToastDescription>
                  {error instanceof Error ? error.message : "Failed to submit problem"}
                </ToastDescription>
              </Toast>
            ),
          });
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-background-0">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <BlurBackground position="statusBar" />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          style={{ paddingTop: insets.top }}
        >
          <VStack className="flex-1 py-6" space="xl">
            <VStack space="xs" className="px-6">
              <Heading size="2xl" className="text-typography-900">
                Contribute a Problem
              </Heading>
              <Text className="text-typography-600">Share a new boulder problem.</Text>
            </VStack>

            <Divider />

            <VStack space="lg" className="px-6">
              <Text className="text-typography-700 font-semibold">Contact Information</Text>
              <VStack space="md">
                <Text className="text-typography-700">Your Name</Text>
                <Input>
                  <InputField
                    placeholder="Your name"
                    value={contactName}
                    onChangeText={setContactName}
                    onBlur={() => markTouched("contactName")}
                    accessibilityLabel="Your name"
                    autoCapitalize="words"
                  />
                </Input>
                <FieldError message={visibleErrors.contactName} />
              </VStack>

              <VStack space="md">
                <Text className="text-typography-700">Email</Text>
                <Input>
                  <InputField
                    placeholder="your.email@example.com"
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    onBlur={() => markTouched("contactEmail")}
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </Input>
                <FieldError message={visibleErrors.contactEmail} />
              </VStack>
            </VStack>

            <Divider />

            <VStack space="lg" className="px-6">
              <Text className="text-typography-700 font-semibold">Problem Details</Text>
              <VStack space="md">
                <Text className="text-typography-700">Name</Text>
                <Input>
                  <InputField
                    placeholder="Problem name"
                    value={name}
                    onChangeText={setName}
                    onBlur={() => markTouched("name")}
                    accessibilityLabel="Problem name"
                    autoCapitalize="words"
                  />
                </Input>
                <FieldError message={visibleErrors.name} />
              </VStack>
            </VStack>

            <VStack space="md" className="px-6">
              <Text className="text-typography-700">Grade</Text>
              <Button variant="outline" onPress={() => setIsGradeOpen(true)}>
                <HStack className="items-center" space="sm">
                  <ButtonText>{grade || "Select grade"}</ButtonText>
                  <ChevronDown />
                </HStack>
              </Button>
              <FieldError message={visibleErrors.grade} />
            </VStack>

            <VStack space="md" className="px-6">
              <Text className="text-typography-700">Area</Text>
              <Input>
                <InputField
                  placeholder="Area"
                  value={subarea}
                  onChangeText={setSubarea}
                  onBlur={() => markTouched("area")}
                  accessibilityLabel="Area"
                  autoCapitalize="words"
                />
              </Input>
              <Button variant="outline" onPress={() => setIsAreaOpen(true)}>
                <HStack className="items-center" space="sm">
                  <ButtonIcon as={MapPin} size="sm" />
                  <ButtonText>Browse areas</ButtonText>
                </HStack>
              </Button>
              <FieldError message={visibleErrors.area} />
            </VStack>

            <CoordinateInput
              latitude={latitude}
              longitude={longitude}
              onChangeLatitude={setLatitude}
              onChangeLongitude={setLongitude}
              onBlur={() => markTouched("coordinates")}
              error={visibleErrors.coordinates}
            />

            <VStack space="md" className="px-6">
              <Text className="text-typography-700">Description</Text>
              <Text size="sm" className="text-typography-600">
                Describe the start holds. Include features, direction and nature of the climbing as
                well.
              </Text>
              <Input className="h-20">
                <InputField
                  placeholder="Ex. 'Start matched on the chest-high crimp and climb up and right through slopers.'"
                  value={description}
                  onChangeText={setDescription}
                  onBlur={() => markTouched("description")}
                  textAlignVertical="top"
                  multiline
                  accessibilityLabel="Problem description"
                  className="pt-2"
                />
              </Input>
              <FieldError message={visibleErrors.description} />
            </VStack>

            <Divider />

            <TopoPicker
              value={topoData}
              onChange={setTopoData}
              onOpenDrawingModal={handleOpenDrawingModal}
              error={visibleErrors.topo}
            />

            <Divider />

            <Button
              action="positive"
              onPress={handleSubmit}
              isDisabled={submitMutation.isPending}
              className="mx-6"
            >
              {submitMutation.isPending ? (
                <Spinner size="small" color="white" />
              ) : (
                <ButtonText>Submit Problem</ButtonText>
              )}
            </Button>
          </VStack>
          <View style={{ height: Platform.OS === "ios" ? tabBarHeight : 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <GradePicker isOpen={isGradeOpen} onClose={handleGradeSelect} currentGrade={grade} />
      <AreaPicker
        isOpen={isAreaOpen}
        onClose={() => setIsAreaOpen(false)}
        onSelect={setSubarea}
        currentArea={subarea}
      />
      {(topoData.selectedTopoUri || topoData.pickedImage?.uri) && (
        <ImageDrawingModal
          isOpen={isDrawingModalOpen}
          imageUri={topoData.selectedTopoUri || topoData.pickedImage?.uri || ""}
          onClose={handleCloseDrawingModal}
          onConfirm={handleConfirmDrawing}
        />
      )}
    </View>
  );
}
