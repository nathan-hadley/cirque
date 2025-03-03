const tintColorLight = '#007AFF'; // iOS blue
const tintColorDark = '#0A84FF'; // iOS dark mode blue

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#8E8E93', // iOS gray
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
    card: '#F2F2F7', // iOS light gray
    border: '#C6C6C8', // iOS border color
    notification: '#FF3B30', // iOS red
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: tintColorDark,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorDark,
    card: '#1C1C1E', // iOS dark mode card
    border: '#38383A', // iOS dark mode border
    notification: '#FF453A', // iOS dark mode red
  },
}; 