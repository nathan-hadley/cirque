import { useContext } from 'react';
import { MapContext } from '@/contexts/MapContext';

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}