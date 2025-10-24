import React, { useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ChevronDown, MapPin } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import AreaPicker from "./AreaPicker";
import CoordinateInput from "./CoordinateInput";
import GradePicker from "./GradePicker";

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
          description: description.trim() ? description : undefined,
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
          line: [], // Will be added in future when topo drawing is implemented
        },
      },
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
