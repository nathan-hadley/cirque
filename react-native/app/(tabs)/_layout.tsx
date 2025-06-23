import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/TabBarBackground";
import { Icon } from "@/components/ui/icon";
import { Map, Info } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
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
    </Tabs>
  );
}
