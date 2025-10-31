import React from "react";
import { View } from "react-native";
import * as Location from "expo-location";
import { Crosshair } from "lucide-react-native";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSimpleToast } from "@/hooks/useSimpleToast";

export type CoordinateInputProps = {
  latitude: string;
  longitude: string;
  onChangeLatitude: (value: string) => void;
  onChangeLongitude: (value: string) => void;
  onBlur?: () => void;
  error?: string;
};

export default function CoordinateInput({
  latitude,
  longitude,
  onChangeLatitude,
  onChangeLongitude,
  onBlur,
  error,
}: CoordinateInputProps) {
  const showToast = useSimpleToast();

  async function handleUseMyLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onChangeLatitude(current.coords.latitude.toFixed(6));
      onChangeLongitude(current.coords.longitude.toFixed(6));
    } catch {
      showToast({
        action: "error",
        message: "Unable to get your location. Please try again.",
      });
    }
  }

  return (
    <VStack space="sm" className="px-6">
      <Text className="text-typography-700">Coordinates</Text>
      <HStack space="md" className="items-center">
        <View className="flex-1">
          <Input>
            <InputField
              keyboardType="numeric"
              placeholder="Latitude"
              value={latitude}
              onChangeText={onChangeLatitude}
              onBlur={onBlur}
              accessibilityLabel="Latitude"
            />
          </Input>
        </View>
        <View className="flex-1">
          <Input>
            <InputField
              keyboardType="numeric"
              placeholder="Longitude"
              value={longitude}
              onChangeText={onChangeLongitude}
              onBlur={onBlur}
              accessibilityLabel="Longitude"
            />
          </Input>
        </View>
      </HStack>
      {error ? <Text className="text-error-600">{error}</Text> : null}
      <Button onPress={handleUseMyLocation} variant="outline">
        <ButtonIcon as={Crosshair} />
        <ButtonText>Use my location</ButtonText>
      </Button>
    </VStack>
  );
}
