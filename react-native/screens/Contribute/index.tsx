import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Select, SelectTrigger, SelectInput, SelectContent, SelectItem, SelectItemText, SelectBackdrop, SelectPortal } from "@/components/ui/select";
import { ChevronDown, FileText } from "lucide-react-native";
import CoordinateInput from "./CoordinateInput";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const SUBAREAS = [
  "Barney's Rubble",
  "Clamshell Cave",
  "Straightaways",
  "Forestland",
  "Swiftwater",
] as const;

const GRADES = Array.from({ length: 11 }, (_, i) => `V${i}`);

type Errors = Partial<{
  name: string;
  grade: string;
  subarea: string;
  description: string;
  coordinates: string;
}>;

export default function ContributeScreen() {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string | null>(null);
  const [subarea, setSubarea] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isSubareaOpen, setIsSubareaOpen] = useState(false);

  const tabBarHeight = useBottomTabBarHeight();

  const errors: Errors = useMemo(() => {
    const e: Errors = {};
    const nameTrim = name.trim();
    if (nameTrim.length < 2) e.name = "Please enter a name (min 2 chars).";

    if (!grade || !GRADES.includes(grade)) e.grade = "Select a grade (V0-V10).";

    if (!subarea || !SUBAREAS.includes(subarea as any)) e.subarea = "Select a subarea.";

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    const latValid = Number.isFinite(latNum) && latNum >= -90 && latNum <= 90;
    const lngValid = Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180;
    if (!latValid || !lngValid) e.coordinates = "Enter valid lat (-90..90) and lng (-180..180).";

    return e;
  }, [name, grade, subarea, latitude, longitude]);

  const isValid = Object.keys(errors).length === 0;

  return (
    <ScrollView className="flex-1 bg-background-0" showsVerticalScrollIndicator={false}>
      <View className="px-6 py-6 flex-1">
        <VStack space="xl">
          <VStack space="xs">
            <Heading size="2xl" className="text-typography-900">Contribute a Problem</Heading>
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
            {errors.name ? <Text className="text-error-600">{errors.name}</Text> : null}
          </VStack>

          <VStack space="md">
            <Text className="text-typography-700">Grade</Text>
            <Select isOpen={isGradeOpen} onOpen={() => setIsGradeOpen(true)} onClose={() => setIsGradeOpen(false)}>
              <SelectTrigger onPress={() => setIsGradeOpen(true)}>
                <HStack className="items-center justify-between w-full">
                  <SelectInput>{grade || "Select grade"}</SelectInput>
                  <ChevronDown />
                </HStack>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop onPress={() => setIsGradeOpen(false)} />
                <SelectContent>
                  {GRADES.map(g => (
                    <SelectItem key={g} onPress={() => { setGrade(g); setIsGradeOpen(false); }}>
                      <SelectItemText>{g}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
            {errors.grade ? <Text className="text-error-600">{errors.grade}</Text> : null}
          </VStack>

          <VStack space="md">
            <Text className="text-typography-700">Subarea</Text>
            <Select isOpen={isSubareaOpen} onOpen={() => setIsSubareaOpen(true)} onClose={() => setIsSubareaOpen(false)}>
              <SelectTrigger onPress={() => setIsSubareaOpen(true)}>
                <HStack className="items-center justify-between w-full">
                  <SelectInput>{subarea || "Select subarea"}</SelectInput>
                  <ChevronDown />
                </HStack>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop onPress={() => setIsSubareaOpen(false)} />
                <SelectContent>
                  {SUBAREAS.map(s => (
                    <SelectItem key={s} onPress={() => { setSubarea(s); setIsSubareaOpen(false); }}>
                      <SelectItemText>{s}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
            {errors.subarea ? <Text className="text-error-600">{errors.subarea}</Text> : null}
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
            <Input>
              <InputField
                placeholder="Short description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Problem description"
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
      </View>
      <View style={{ height: tabBarHeight }} />

      {/* Select modals are handled by SelectPortal */}
    </ScrollView>
  );
}
