import { Link, Stack, usePathname } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export default function NotFoundScreen() {
  const path = usePathname();

  return (
    <SafeAreaView className="bg-background-0 h-full">
      <Stack.Screen options={{ title: 'Oops!' }}></Stack.Screen>
      <ScrollView className="p-5">
        <VStack space="md">
          <Heading size="2xl">{"This Screen doesn't exist"}</Heading>
          <Link href="/" asChild>
            <Button action={'primary'} variant={'solid'} size={'lg'} isDisabled={false}>
              <ButtonText>{'Go Home'}</ButtonText>
            </Button>
          </Link>
          {process.env.NODE_ENV !== 'production' && <Text>{path}</Text>}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
