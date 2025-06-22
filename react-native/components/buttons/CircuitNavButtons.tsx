import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { Button, ButtonIcon } from '../ui/button';
import { HStack } from '../ui/hstack';
import { useProblemStore } from '@/stores/problemStore';
import { mapProblemService } from '@/services/mapProblemService';
import * as Haptics from 'expo-haptics';

export function CircuitNavButtons() {
  const { problem, getProblem } = useProblemStore();

  const color = problem?.color ?? 'black';

  async function handlePreviousProblem() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mapProblemService.showPreviousProblem();
  }

  async function handleNextProblem() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mapProblemService.showNextProblem();
  }

  function showPreviousButton() {
    if (!problem || !problem.order) return false;
    return problem.order !== 1;
  }

  function showNextButton() {
    if (!problem || !problem.order) return false;
    const nextProblem = getProblem(problem.colorStr, problem.subarea || '', problem.order + 1);
    return nextProblem !== null;
  }

  return (
    <HStack className={`${!showPreviousButton() ? 'justify-end' : 'justify-between'} w-full px-2`}>
      {showPreviousButton() && (
        <Button
          onPress={handlePreviousProblem}
          action="secondary"
          className="bg-typography-0/50 rounded-full w-12 h-12"
        >
          <ButtonIcon as={ChevronLeftIcon} size="lg" color={color} />
        </Button>
      )}

      {showNextButton() && (
        <Button
          onPress={handleNextProblem}
          action="secondary"
          className="bg-typography-0/50 rounded-full w-12 h-12"
        >
          <ButtonIcon as={ChevronRightIcon} size="lg" color={color} />
        </Button>
      )}
    </HStack>
  );
}
