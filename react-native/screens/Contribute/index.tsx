import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { ChevronDown, FileText } from "lucide-react-native";
import CoordinateInput from "./CoordinateInput";
import GradePicker from "./GradePicker";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const GRADES = Array.from({ length: 18 }, (_, i) => `V${i}`);

type Errors = Partial<{
  name: string;
  grade: string;
  subarea: string;
  description: string;
  coordinates: string;
}>;

export default function ContributeScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string | null>(null);
  const [subarea, setSubarea] = useState<string>("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [isGradeOpen, setIsGradeOpen] = useState(false);

  const tabBarHeight = useBottomTabBarHeight();

  function getErrors() {
    const e: Errors = {};
    const nameTrim = name.trim();
    if (nameTrim.length < 1) e.name = "Please enter a name.";

    if (!grade || !GRADES.includes(grade)) e.grade = "Select a grade.";

    const subareaTrim = subarea.trim();
    if (subareaTrim.length < 1) e.subarea = "Please enter an area.";

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    const latValid = Number.isFinite(latNum) && latNum >= -90 && latNum <= 90;
    const lngValid = Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180;
    if (!latValid || !lngValid) e.coordinates = "Enter valid lat and lng.";

    return e;
  }

  const errors = getErrors();

  const isValid = Object.keys(errors).length === 0;

  function handleGradeClose(grade: string) {
    setGrade(grade);
    setIsGradeOpen(false);
  }

  return (
    <ScrollView
      className="flex-1 bg-background-0"
      showsVerticalScrollIndicator={false}
      style={{ marginTop: insets.top }}
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

        <VStack space="md">
          <Text className="text-typography-700">Name</Text>
          <Input>
            <InputField
              placeholder="Problem name"
              value={name}
              onChangeText={setName}
              accessibilityLabel="Problem name"
              autoCapitalize="words"
            />
          </Input>
          {errors.name ? <ErrorMessage error={errors.name} /> : null}
        </VStack>

        <VStack space="md">
          <Text className="text-typography-700">Grade</Text>
          <Button variant="outline" onPress={() => setIsGradeOpen(true)}>
            <HStack className="items-center" space="sm">
              <ButtonText>{grade || "Select grade"}</ButtonText>
              <ChevronDown />
            </HStack>
          </Button>
          {errors.grade ? <ErrorMessage error={errors.grade} /> : null}
        </VStack>

        <VStack space="md">
          <Text className="text-typography-700">Area</Text>
          <Input>
            <InputField
              placeholder="Area"
              value={subarea}
              onChangeText={setSubarea}
              accessibilityLabel="Area"
              autoCapitalize="words"
            />
          </Input>
          {errors.subarea ? <ErrorMessage error={errors.subarea} /> : null}
        </VStack>

        <CoordinateInput
          latitude={latitude}
          longitude={longitude}
          onChangeLatitude={setLatitude}
          onChangeLongitude={setLongitude}
          error={errors.coordinates}
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

        <HStack className="justify-end" space="md">
          <Button variant="outline">
            <ButtonIcon as={FileText} />
            <ButtonText>Save Draft</ButtonText>
          </Button>
          <Button action="positive" isDisabled={!isValid}>
            <ButtonText>Continue</ButtonText>
          </Button>
        </HStack>
      </VStack>
      <View style={{ height: tabBarHeight }} />

      <GradePicker isOpen={isGradeOpen} onClose={handleGradeClose} currentGrade={grade} />
    </ScrollView>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return <Text className="text-error-600">{error}</Text>;
}
