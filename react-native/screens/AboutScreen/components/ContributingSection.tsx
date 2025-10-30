import React from "react";
import { Pressable } from "react-native";
import { Link, router } from "expo-router";
import { ExternalLink, MessageCircle, PlusCircle } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

export function ContributingSection() {
  return (
    <VStack space="lg">
      <VStack space="sm">
        <Heading size="xl">Get Involved</Heading>
        <Text className="text-typography-600">
          Help expand these circuits, add off-circuit problems, or contribute to the development of
          this app.
        </Text>
      </VStack>

      <VStack space="md">
        <Pressable onPress={() => router.push("/contribute")}>
          <HStack
            space="md"
            className="bg-background-50 border border-outline-200 rounded-xl p-4 items-center"
          >
            <Icon as={PlusCircle} size="xl" className="text-success-600" />
            <VStack className="flex-1">
              <Text className="font-semibold">Contribute</Text>
              <Text className="text-sm text-typography-600">Submit a problem</Text>
            </VStack>
          </HStack>
        </Pressable>

        <HStack
          space="md"
          className=" bg-background-50 border border-outline-200 rounded-xl p-4 items-center"
        >
          <Icon as={ExternalLink} size="xl" className="text-typography-700" />
          <VStack className="flex-1">
            <Text className="font-semibold">Open source project</Text>
            <Link href="https://github.com/nathan-hadley/cirque" asChild>
              <Text className="text-sm text-primary-600 underline">View on GitHub →</Text>
            </Link>
          </VStack>
        </HStack>

        <HStack
          space="md"
          className="bg-background-50 border border-outline-200 rounded-xl p-4 items-center"
        >
          <Icon as={MessageCircle} size="xl" className="text-warning-500" />
          <VStack className="flex-1">
            <Text className="font-semibold">Contact</Text>
            <Text className="text-sm text-typography-600">
              @nathanhadley_ on Instagram or Threads
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  );
}
