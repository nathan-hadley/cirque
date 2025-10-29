import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { Info, Map, PlusCircle } from "lucide-react-native";
import BlurBackground from "@/components/BlurBackground";
import { HapticTab } from "@/components/HapticTab";
import { Icon } from "@/components/ui/icon";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => <BlurBackground position="tabBar" />,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ focused }) => (
            <Icon className={`${focused ? "text-blue-500" : "text-typography-500"}`} as={Map} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ focused }) => (
            <Icon className={`${focused ? "text-blue-500" : "text-typography-500"}`} as={Info} />
          ),
        }}
      />
      <Tabs.Screen
        name="contribute"
        options={{
          title: "Contribute",
          tabBarIcon: ({ focused }) => (
            <Icon
              className={`${focused ? "text-blue-500" : "text-typography-500"}`}
              as={PlusCircle}
            />
          ),
        }}
      />
    </Tabs>
  );
}
