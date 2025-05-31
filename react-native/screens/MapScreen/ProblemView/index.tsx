import React from 'react';
import { Info } from './Info';
import { Problem } from '@/screens/MapScreen/ProblemView/problems';
import { Topo } from './Topo/index';
import { VStack } from '@/components/ui/vstack';

interface ProblemViewProps {
  problem: Problem;
}

export function ProblemView({ problem }: ProblemViewProps) {
  if (!problem) return null;

  return (
    <VStack className="gap-1">
      <Topo problem={problem} />
      <Info problem={problem} />
    </VStack>
  );
}
