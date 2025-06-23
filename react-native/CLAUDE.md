# Claude Context - Cirque React Native App

## Project Overview

- React Native app built with Expo
- Uses pnpm as package manager
- Map-based bouldering problem app
- Built with TypeScript and NativeWind (Tailwind CSS)

## Key Dependencies

- **UI Framework**: gluestack-ui components
- **Maps**: @rnmapbox/maps for Mapbox integration
- **Navigation**: expo-router
- **State Management**: zustand stores
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Icons**: lucide-react-native

## Important Commands

- `pnpm install` - Install dependencies
- `pnpm start` - Start Expo development server
- `npx gluestack-ui add [component]` - Add gluestack-ui components

## Project Structure

```
/components/
  /ui/ - gluestack-ui components (Input, Text, VStack, HStack, etc.)
  MapSearchBar.tsx - Fake search bar trigger (TouchableOpacity)
  SearchOverlay.tsx - Full-screen search overlay with real functionality
/screens/
  /MapScreen/ - Main map screen that coordinates search components
/stores/
  problemStore.ts - Problem data management
  mapStore.ts - Map state management
/models/
  problems.ts - Problem type definitions
```

## Search Architecture

Two-tier search system:

1. **MapSearchBar** - Compact trigger button that looks like a search input
2. **SearchOverlay** - Full-screen overlay with actual search functionality

## Code Conventions

- Uses NativeWind className prop for styling
- Components follow gluestack-ui patterns
- TypeScript with strict typing
- Functional components with hooks
- File paths use @ alias for absolute imports
