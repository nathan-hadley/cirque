import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  progress: number; // 0-100
}

export function CircularProgress({
  progress,
}: CircularProgressProps) {
  const animatedProgress = useSharedValue(0);
  const size = 20;
  const strokeWidth = 2;
  const color = '#3B82F6'; // blue-500
  const backgroundColor = '#E5E7EB'; // gray-200
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Animate progress changes
  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 300 });
  }, [progress, animatedProgress]);

  // Calculate stroke dash offset based on progress
  const strokeDashoffset = useDerivedValue(() => {
    return circumference - (animatedProgress.value / 100) * circumference;
  });

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
} 