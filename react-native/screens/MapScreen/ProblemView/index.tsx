import React from 'react';
import { Info } from './Info';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { Topo } from './Topo/index';
import { VStack } from '@/components/ui/vstack';
import { ActionsheetContent, ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet';

interface ProblemViewProps {
  problem: Problem;
}

export function ProblemView({ problem }: ProblemViewProps) {
  if (!problem) return null;

  return (
    <ActionsheetContent className="p-0">
      <VStack className="gap-1">
        <ActionsheetDragIndicatorWrapper className="pt-0">
          <Topo problem={problem} />
        </ActionsheetDragIndicatorWrapper>
        <Info problem={problem} />
      </VStack>
    </ActionsheetContent>
  );
}
