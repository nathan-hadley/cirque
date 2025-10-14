import { FeatureCollection, Point, GeoJsonProperties } from 'geojson';

/*
 * Auto-generated from cirque-data/areas/areas.geojson
 *
 * This file contains all area boundary data for the Cirque app.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * To update:
 *   1. Edit cirque-data/areas/areas.geojson
 *   2. Run: npm run sync-areas
 *   3. Commit both files
 *
 * Generated: 2025-10-14T20:35:36.195Z
 * Features: 2
 */

export const areasData: FeatureCollection<Point, GeoJsonProperties> = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Tumwater Canyon"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -120.72086368561,
          47.61287565091
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Icicle Canyon"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -120.7507327652,
          47.55521374701
        ]
      }
    }
  ]
};

export default areasData;
