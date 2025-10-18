import React, { useMemo, useState } from "react";
import Mapbox, { MapView, Camera, ShapeSource, CircleLayer } from "@rnmapbox/maps";
import { View } from "react-native";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from "@/components/ui/actionsheet";
import { MapPin, X } from "lucide-react-native";
import { INITIAL_CENTER, STYLE_URI, MAPBOX_ACCESS_TOKEN } from "@/constants/map";
import { useSafeAreaInsets } from "react-native-safe-area-context";

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export type CoordinateInputProps = {
  latitude: string;
  longitude: string;
  onChangeLatitude: (value: string) => void;
  onChangeLongitude: (value: string) => void;
  error?: string;
};

export default function CoordinateInput({ latitude, longitude, onChangeLatitude, onChangeLongitude, error }: CoordinateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempLngLat, setTempLngLat] = useState<[number, number] | null>(() => {
    const lng = parseFloatSafe(longitude);
    const lat = parseFloatSafe(latitude);
    return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] as [number, number] : null;
  });

  const { bottom } = useSafeAreaInsets();

  const markerShape = useMemo(() => {
    if (!tempLngLat) return null;
    return {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: tempLngLat,
      },
      properties: {},
    };
  }, [tempLngLat]);

  function parseFloatSafe(value: string): number {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : NaN;
  }

  function handleMapPress(event: any) {
    const coords = event?.geometry?.coordinates as [number, number] | undefined;
    if (!coords) return;
    setTempLngLat(coords);
  }

  function handleConfirm() {
    if (tempLngLat) {
      onChangeLongitude(tempLngLat[0].toFixed(6));
      onChangeLatitude(tempLngLat[1].toFixed(6));
    }
    setIsOpen(false);
  }

  return (
    <VStack space="sm">
      <Text className="text-typography-700">Coordinates</Text>
      <HStack space="md" className="items-center">
        <View className="flex-1">
          <Input>
            <InputField
              keyboardType="numeric"
              placeholder="Latitude"
              value={latitude}
              onChangeText={onChangeLatitude}
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
              accessibilityLabel="Longitude"
            />
          </Input>
        </View>
      </HStack>
      {error ? (
        <Text className="text-error-600">{error}</Text>
      ) : null}
      <Button onPress={() => setIsOpen(true)} variant="outline">
        <ButtonIcon as={MapPin} />
        <ButtonText>Pick on map</ButtonText>
      </Button>

      <Actionsheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="p-0" style={{ paddingBottom: bottom + 16 }}>
          <ActionsheetDragIndicatorWrapper className="pt-3 pb-2">
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full px-4 pb-4" space="md">
            <Text size="lg" className="font-semibold">Tap to select a location</Text>
            <View style={{ height: 320 }} className="overflow-hidden rounded-xl">
              <MapView style={{ flex: 1 }} styleURL={STYLE_URI} onPress={handleMapPress}>
                <Camera
                  centerCoordinate={tempLngLat ?? INITIAL_CENTER}
                  zoomLevel={tempLngLat ? 16 : 12}
                  animationDuration={0}
                />
                {markerShape ? (
                  <ShapeSource id="contrib-selected-point" shape={markerShape as any}>
                    <CircleLayer
                      id="contrib-selected-point-layer"
                      style={{ circleRadius: 6, circleColor: "#22c55e", circleStrokeWidth: 2, circleStrokeColor: "#14532d" }}
                    />
                  </ShapeSource>
                ) : null}
              </MapView>
            </View>
            <HStack className="justify-end" space="md">
              <Button variant="outline" onPress={() => setIsOpen(false)}>
                <ButtonIcon as={X} />
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button action="positive" onPress={handleConfirm} isDisabled={!tempLngLat}>
                <ButtonText>Use this location</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </VStack>
  );
}
