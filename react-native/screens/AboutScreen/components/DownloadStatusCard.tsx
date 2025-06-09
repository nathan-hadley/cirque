import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Download, CheckCircle, RefreshCw, Wifi } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';

interface DownloadStatusCardProps {
  loading: boolean;
  mapDownloaded: boolean;
  onUpdate: () => void;
}

export function DownloadStatusCard({ loading, mapDownloaded, onUpdate }: DownloadStatusCardProps) {
  return (
    <View className="bg-background-50 border border-outline-200 rounded-2xl p-6">
      <VStack space="md">
        <HStack space="md" className="items-center">
          {mapDownloaded ? (
            <Icon as={CheckCircle} size="xl" className="text-green-600" />
          ) : (
            <Icon as={Download} size="xl" className="text-blue-600" />
          )}
          <VStack className="flex-1">
            <Text className="font-semibold text-lg">
              {mapDownloaded ? 'Maps Downloaded' : 'Download Offline Maps'}
            </Text>
            <Text className="text-sm text-typography-600">
              {mapDownloaded
                ? 'Maps ready for offline use'
                : 'Ensure circuits work without network'}
            </Text>
          </VStack>
        </HStack>

        {loading && (
          <View className="bg-info-50 rounded-lg p-3 h-12">
            <HStack space="sm" className="items-center">
              <Spinner size="small" />
              <Text className="text-info-700 text-sm">Downloading map tiles...</Text>
            </HStack>
          </View>
        )}

        <Button
          onPress={onUpdate}
          disabled={loading}
          action={'positive'}
          className={`rounded-xl`}
          size="lg"
        >
          <HStack space="sm" className="items-center">
            {loading ? (
              <Spinner size="small" color="white" />
            ) : mapDownloaded ? (
              <ButtonIcon as={RefreshCw} size="sm" className="text-white" />
            ) : (
              <ButtonIcon as={Download} size="sm" className="text-white" />
            )}
            <ButtonText className="text-white font-semibold">
              {loading ? 'Downloading...' : mapDownloaded ? 'Update Maps' : 'Download Maps'}
            </ButtonText>
          </HStack>
        </Button>
      </VStack>
    </View>
  );
}
