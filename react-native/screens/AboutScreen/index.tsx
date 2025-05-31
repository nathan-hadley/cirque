import React from 'react';
import { View, ScrollView, ActivityIndicator, Linking, SafeAreaView } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useOfflineMaps } from '@/hooks/useOfflineMaps';
import { Button, ButtonText } from '@/components/ui/button';
import { Link } from 'expo-router';

const BulletText = ({ text }: { text: string }) => (
  <View className="flex-row items-start my-1">
    <Text className="mr-2">•</Text>
    <Text>{text}</Text>
  </View>
);

export default function AboutScreen() {
  const { loading, mapDownloaded, successMessage, errorMessage, updateMapData } = useOfflineMaps();
  const tabBarHeight = useBottomTabBarHeight();

  const circuits = [
    'Forestland Blue Circuit (V0-2)',
    'Swiftwater Red Circuit (V0-3)',
    'Forestland Black Circuit (V2-5)',
    'Straightaways White Circuit (V4-9)',
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 bg-white dark:bg-gray-900"
        contentContainerStyle={{
          paddingBottom: tabBarHeight,
        }}
      >
        <View className="px-4 py-6">
          <Heading size="xl" className="mb-4">
            About
          </Heading>

          <Text className="mb-4">
            After a trip to Fontainebleau, France, we were inspired to bring their concept of
            bouldering circuits to Leavenworth. These circuits have been developed so far:
          </Text>

          {circuits.map((circuit, index) => (
            <BulletText key={index} text={circuit} />
          ))}

          <Text className="my-4">
            If you're a developer, please reach out about contributing. If you're not a developer
            but want to help, please also reach out me at @nathanhadley_ on Instagram or Threads.
            Collecting all the information to add a new circuit takes time and I could use help!
          </Text>

          <Text className="mb-4">
            The code for this project can be found at{' '}
            <Link href="https://github.com/nathan-hadley/cirque-ios" className="text-blue-500">
              GitHub
            </Link>
            .
          </Text>

          <Heading size="lg" className="mt-6 mb-4">
            Download Maps
          </Heading>

          <Text className="mb-6">
            The app caches map data after viewing for an undetermined amount of time. To ensure
            circuits show up without network connection, download for offline use. If one of the
            circuits listed above is missing, try updating the map.
          </Text>

          {successMessage ? (
            <View className="bg-green-500 p-4 rounded-md mb-4">
              <Text className="text-white">{successMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View className="bg-red-500 p-4 rounded-md mb-4">
              <Text className="text-white">{errorMessage}</Text>
            </View>
          ) : null}

          {loading ? (
            <View className="items-center my-4">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : (
            <Button onPress={updateMapData} className="bg-blue-500 items-center mb-4">
              <ButtonText className="text-typography-0 font-medium">
                {mapDownloaded ? 'Update Map' : 'Download Map'}
              </ButtonText>
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
