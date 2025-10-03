import { FeatureCollection, Point, GeoJsonProperties } from 'geojson';

/*
 * Auto-generated from cirque-data/subareas/subarea-centers.geojson
 *
 * This file contains all subarea label data for the Cirque app.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * To update:
 *   1. Edit cirque-data/subareas/subarea-centers.geojson
 *   2. Run: npm run sync-areas
 *   3. Commit both files
 *
 * Generated: 2025-10-03T04:12:47.655Z
 * Features: 5
 */

export const subareasData: FeatureCollection<Point, GeoJsonProperties> = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Barney's Rubble"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -120.73545458078,
          47.54297536774
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Clamshell Cave"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -120.72937667906,
          47.54487644229
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Straightaways"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -120.7462474031,
          47.54585721913
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Forestland"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -120.73302986383,
          47.54530735626
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Swiftwater"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -120.72892998547,
          47.65451318915
        ]
      }
    }
  ]
};

export default subareasData;
