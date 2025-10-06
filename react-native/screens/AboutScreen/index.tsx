import { View, ScrollView, Platform } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useOfflineMaps } from "@/hooks/useOfflineMaps";
import { useToast, Toast, ToastTitle } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { Divider } from "@/components/ui/divider";
import { CircuitCard, DownloadStatusCard, ContributingSection } from "./components";
import { Icon } from "@/components/ui/icon";
import { CircleIcon } from "lucide-react-native";
import { mapProblemService } from "@/services/mapProblemService";
import { HStack } from "@/components/ui/hstack";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const { loading, mapDownloaded, progress, updateMapData, deleteMapData } = useOfflineMaps();
  const toast = useToast();
  const tabBarHeight = useBottomTabBarHeight();

  const circuits = [
    {
      title: "Forestland Blue Circuit",
      difficulty: "V0-2 • Intermediate",
      color: "border-info-200 bg-info-50",
      circuitColor: "blue",
      subarea: "Forestland",
    },
    {
      title: "Swiftwater Red Circuit",
      difficulty: "V0-3 • Advanced",
      color: "border-error-200 bg-error-50",
      circuitColor: "red",
      subarea: "Swiftwater",
    },
    {
      title: "Mad Meadows Red Circuit",
      difficulty: "V0-4 • Advanced",
      color: "border-error-200 bg-error-50",
      circuitColor: "red",
      subarea: "Mad Meadows",
    },
    {
      title: "Forestland Black Circuit",
      difficulty: "V2-5 • Expert",
      color: "border-typography-300 bg-typography-200",
      circuitColor: "black",
      subarea: "Forestland",
    },
    {
      title: "Straightaways White Circuit",
      difficulty: "V4-9 • Extreme",
      color: "border-typography-200",
      circuitColor: "white",
      subarea: "Straightaways",
    },
  ];

  const showToast = (message: string, success: boolean = true) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action={success ? "success" : "error"} variant="solid">
          <ToastTitle>{message}</ToastTitle>
        </Toast>
      ),
    });
  };

  const handleMapUpdate = async () => {
    try {
      const result = await updateMapData();
      showToast(result.message, result.success);
    } catch {
      showToast("An unexpected error occurred", false);
    }
  };

  const handleMapDelete = async () => {
    try {
      const result = await deleteMapData();
      showToast(result.message, result.success);
    } catch {
      showToast("An unexpected error occurred", false);
    }
  };

  const handleCircuitPress = async (circuit: (typeof circuits)[0]) => {
    router.push("/");

    // Wait a bit for navigation to complete then navigate to the first problem
    global.setTimeout(() => {
      mapProblemService.navigateToProblem({
        circuitColor: circuit.circuitColor,
        subarea: circuit.subarea,
        order: 1,
      });
    }, 300);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8 flex-1">
          {/* Header Section */}
          <VStack space="md" className="mb-8 items-center gap-2">
            <HStack className="items-center gap-2">
              <Heading size="2xl" className="text-center text-typography-900">
                Cirque Leavy
              </Heading>
              <Icon as={CircleIcon} size="xl" className="text-blue-600" />
            </HStack>
            <Text className="text-center text-typography-600 text-lg">
              Fontainebleau-style circuits in Leavenworth
            </Text>
          </VStack>

          {/* Circuits Section */}
          <VStack space="lg" className="mb-6">
            <VStack space="sm">
              <Heading size="xl" className="text-typography-900">
                Available Circuits
              </Heading>
              <Text className="text-typography-600">
                Inspired by our trip to Fontainebleau, France, these circuits bring structured
                bouldering progression to Leavenworth's granite.
              </Text>
            </VStack>

            <VStack space="md">
              {circuits.map((circuit, index) => (
                <CircuitCard
                  key={index}
                  title={circuit.title}
                  difficulty={circuit.difficulty}
                  color={circuit.color}
                  onPress={() => handleCircuitPress(circuit)}
                />
              ))}
            </VStack>
          </VStack>

          <Divider className="my-6" />

          {/* Download Section */}
          <VStack space="lg" className="mb-6">
            <VStack space="sm">
              <Heading size="xl" className="text-typography-900">
                Offline Access
              </Heading>
              <Text className="text-typography-600">
                The app caches map data after viewing, but for guaranteed offline access to all
                circuits, download the complete map package below.
              </Text>
            </VStack>

            <DownloadStatusCard
              loading={loading}
              mapDownloaded={mapDownloaded}
              progress={progress}
              onUpdate={handleMapUpdate}
              onDelete={handleMapDelete}
            />
          </VStack>

          <Divider className="my-6" />

          {/* Contributing Section */}
          <ContributingSection />
        </View>
        <View style={{ height: Platform.OS === "ios" ? tabBarHeight : 0 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
