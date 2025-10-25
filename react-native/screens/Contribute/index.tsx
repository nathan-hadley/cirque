import React, { useCallback, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Camera, ChevronDown, ImageIcon, MapPin, Pencil } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import BlurBackground from "@/components/BlurBackground";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastDescription, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { useSubmitProblem } from "@/hooks/useSubmitProblem";
import { GRADES } from "@/models/problems";
import { captureFromCamera, PickedImage, pickFromLibrary } from "@/services/imageService";
import AreaPicker from "./AreaPicker";
import CoordinateInput from "./CoordinateInput";
import GradePicker from "./GradePicker";
import { NormalizedPoint } from "./ImageDrawingCanvas";
import { ImageDrawingModal } from "./ImageDrawingModal";

type FieldErrors = {
  contactName?: string;
  contactEmail?: string;
  name?: string;
  grade?: string;
  area?: string;
  coordinates?: string;
};

type FieldName = keyof FieldErrors;

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

  // Image and drawing state
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [normalizedPoints, setNormalizedPoints] = useState<NormalizedPoint[]>([]);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);

  const errors = validateForm(contactName, contactEmail, name, grade, subarea, latitude, longitude);
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

  const handlePickImage = useCallback(async () => {
    try {
      const img = await pickFromLibrary();
      if (img) {
        setPickedImage(img);
        setNormalizedPoints([]);
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
  }, [toast]);

  const handleCaptureImage = useCallback(async () => {
    try {
      const img = await captureFromCamera();
      if (img) {
        setPickedImage(img);
        setNormalizedPoints([]);
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
  }, [toast]);

  const handleOpenDrawingModal = useCallback(() => {
    setIsDrawingModalOpen(true);
  }, []);

  const handleCloseDrawingModal = useCallback(() => {
    setIsDrawingModalOpen(false);
  }, []);

  const handleConfirmDrawing = useCallback((pts: NormalizedPoint[]) => {
    setNormalizedPoints(pts);
    setIsDrawingModalOpen(false);
  }, []);

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
          line: normalizedPoints,
          ...(pickedImage?.base64 && { imageBase64: pickedImage.base64 }),
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
          setPickedImage(null);
          setNormalizedPoints([]);
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
      <BlurBackground position="statusBar" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: insets.top }}
      >
        <VStack className="px-6 py-6 flex-1" space="xl">
          <VStack space="xs">
            <Heading size="2xl" className="text-typography-900">
              Contribute a Problem
            </Heading>
            <Text className="text-typography-600">
              Share a new boulder problem. In later steps, you can add a topo line and image.
            </Text>
          </VStack>

          <VStack space="lg">
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

          <VStack space="lg">
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

          <VStack space="md">
            <Text className="text-typography-700">Grade</Text>
            <Button variant="outline" onPress={() => setIsGradeOpen(true)}>
              <HStack className="items-center" space="sm">
                <ButtonText>{grade || "Select grade"}</ButtonText>
                <ChevronDown />
              </HStack>
            </Button>
            <FieldError message={visibleErrors.grade} />
          </VStack>

          <VStack space="md">
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

          <VStack space="md">
            <Text className="text-typography-700">Description (optional)</Text>
            <Input className="h-20">
              <InputField
                placeholder="Short description"
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
                multiline
                accessibilityLabel="Problem description"
                className="pt-2"
              />
            </Input>
          </VStack>

          <VStack space="lg">
            <Text className="text-typography-700 font-semibold">Topo Image & Line (optional)</Text>
            <Text className="text-typography-600">
              Add a photo and draw the line to help others find this problem.
            </Text>
            <HStack space="md">
              <Button
                onPress={handlePickImage}
                action="secondary"
                variant="outline"
                className="flex-1"
              >
                <ButtonIcon as={ImageIcon} />
                <ButtonText>Select Photo</ButtonText>
              </Button>
              <Button
                onPress={handleCaptureImage}
                action="secondary"
                variant="outline"
                className="flex-1"
              >
                <ButtonIcon as={Camera} />
                <ButtonText>Camera</ButtonText>
              </Button>
            </HStack>
            {pickedImage && (
              <VStack space="md">
                <ImagePreview imageUri={pickedImage.uri} points={normalizedPoints} />
                <Button onPress={handleOpenDrawingModal} action="primary" variant="outline">
                  <ButtonIcon as={Pencil} />
                  <ButtonText>Draw Line</ButtonText>
                </Button>
              </VStack>
            )}
          </VStack>

          <Button action="positive" onPress={handleSubmit} isDisabled={submitMutation.isPending}>
            {submitMutation.isPending ? (
              <Spinner size="small" color="white" />
            ) : (
              <ButtonText>Submit Problem</ButtonText>
            )}
          </Button>
        </VStack>
        <View style={{ height: Platform.OS === "ios" ? tabBarHeight : 16 }} />
      </ScrollView>

      <GradePicker isOpen={isGradeOpen} onClose={handleGradeSelect} currentGrade={grade} />
      <AreaPicker
        isOpen={isAreaOpen}
        onClose={() => setIsAreaOpen(false)}
        onSelect={setSubarea}
        currentArea={subarea}
      />
      {pickedImage && (
        <ImageDrawingModal
          isOpen={isDrawingModalOpen}
          imageUri={pickedImage.uri}
          initialPoints={normalizedPoints}
          onClose={handleCloseDrawingModal}
          onConfirm={handleConfirmDrawing}
        />
      )}
    </View>
  );
}

// Component to preview the image with drawn line (non-editable)
function ImagePreview({ imageUri, points }: { imageUri: string; points: NormalizedPoint[] }) {
  const [layout, setLayout] = React.useState<{ width: number; height: number } | null>(null);

  const handleLayout = React.useCallback((e: any) => {
    const { width } = e.nativeEvent.layout;
    const height = Math.round((width * 3) / 4); // 4:3 aspect ratio
    setLayout({ width, height });
  }, []);

  // Generate path from normalized points
  const screenPoints = React.useMemo(() => {
    if (!layout || points.length === 0) return [];
    return points.map(([nx, ny]) => [nx * layout.width, ny * layout.height]);
  }, [layout, points]);

  let pathData = "";
  if (screenPoints.length > 0) {
    pathData = `M ${screenPoints[0][0]} ${screenPoints[0][1]}`;
    for (let i = 1; i < screenPoints.length; i++) {
      const prev = screenPoints[i - 1];
      const curr = screenPoints[i];
      const midX = (prev[0] + curr[0]) / 2;
      const midY = (prev[1] + curr[1]) / 2;
      pathData += ` Q ${prev[0]} ${prev[1]} ${midX} ${midY}`;
    }
    if (screenPoints.length > 1) {
      const last = screenPoints[screenPoints.length - 1];
      pathData += ` L ${last[0]} ${last[1]}`;
    }
  }

  const startPoint = screenPoints.length > 0 ? screenPoints[0] : null;

  return (
    <View onLayout={handleLayout}>
      <View
        className="w-full rounded-xl overflow-hidden bg-typography-300"
        style={{ height: layout?.height }}
      >
        <Image
          source={{ uri: imageUri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        {layout && points.length > 0 && (
          <Svg
            width={layout.width}
            height={layout.height}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <Path
              d={pathData}
              stroke="#ff3333"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.9}
            />
            {startPoint && (
              <Circle cx={startPoint[0]} cy={startPoint[1]} r={6} fill="#ff3333" opacity={0.9} />
            )}
          </Svg>
        )}
      </View>
    </View>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text className="text-error-600">{message}</Text>;
}

function validateForm(
  contactName: string,
  contactEmail: string,
  name: string,
  grade: string | null,
  area: string,
  latitude: string,
  longitude: string
): FieldErrors {
  const errors: FieldErrors = {};

  if (!contactName.trim()) {
    errors.contactName = "Please enter your name.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!contactEmail.trim()) {
    errors.contactEmail = "Please enter your email.";
  } else if (!emailRegex.test(contactEmail)) {
    errors.contactEmail = "Please enter a valid email.";
  }

  if (!name.trim()) {
    errors.name = "Please enter a problem name.";
  }

  if (!grade || !GRADES.includes(grade)) {
    errors.grade = "Select a grade.";
  }

  if (!area.trim()) {
    errors.area = "Please enter an area.";
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const isValidCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!isValidCoords) {
    errors.coordinates = "Enter valid lat and lng.";
  }

  return errors;
}

function getVisibleErrors(
  errors: FieldErrors,
  touched: Set<FieldName>,
  submitAttempted: boolean
): FieldErrors {
  if (submitAttempted) return errors;

  return Object.entries(errors).reduce((visible, [field, message]) => {
    if (touched.has(field as FieldName)) {
      visible[field as FieldName] = message;
    }
    return visible;
  }, {} as FieldErrors);
}
