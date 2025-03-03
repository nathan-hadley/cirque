import { useColorScheme } from 'react-native';
import Colors from '../constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

type ColorSchemeName = 'light' | 'dark';

export function useThemeColor(
  props: ThemeProps,
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = (useColorScheme() ?? 'light') as ColorSchemeName;
  const colorFromProps = props[theme === 'light' ? 'lightColor' : 'darkColor'];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][colorName];
}
