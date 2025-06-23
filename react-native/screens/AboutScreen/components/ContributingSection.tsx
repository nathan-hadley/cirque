import React from "react";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Link } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { MessageCircle, ExternalLink } from "lucide-react-native";

export function ContributingSection() {
  return (
    <VStack space="lg">
      <VStack space="sm">
        <Heading size="xl">Get Involved</Heading>
        <Text className="text-typography-600">
          Help expand these circuits or contribute to the development of this app.
        </Text>
      </VStack>

      <VStack space="md">
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

        <HStack
          space="md"
          className=" bg-background-50 border border-outline-200 rounded-xl p-4 items-center"
        >
          <Icon as={ExternalLink} size="xl" className="text-typography-700" />
          <VStack className="flex-1">
            <Text className="font-semibold">Open Source Project</Text>
            <Link href="https://github.com/nathan-hadley/cirque" asChild>
              <Text className="text-sm text-primary-600 underline">View on GitHub →</Text>
            </Link>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  );
}
