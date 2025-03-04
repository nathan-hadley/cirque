import { Stack } from 'expo-router';
import { useEffect } from 'react';
import Mapbox from '@rnmapbox/maps';
import { Config } from '../constants/Config';

function RootLayout() {
  useEffect(() => {
    Mapbox.setAccessToken(Config.MAPBOX_ACCESS_TOKEN);
  }, []);

  return <Stack />;
}

export default RootLayout;
