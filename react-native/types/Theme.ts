import Colors from '../constants/Colors';

export type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ColorSchemeName = 'light' | 'dark';

export type Theme = {
  dark: boolean;
  colors: typeof Colors.light;
};
