import { FeatureCollection, LineString, GeoJsonProperties } from 'geojson';

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
 * Generated: 2025-10-03T04:25:10.862Z
 * Features: 3
 */

export const areasData: FeatureCollection<LineString, GeoJsonProperties> = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Mountain Home"
      },
      "geometry": {
        "coordinates": [
          [
            -120.642487,
            47.588091
          ],
          [
            -120.642216,
            47.581654
          ],
          [
            -120.642379,
            47.576388
          ],
          [
            -120.645307,
            47.567025
          ],
          [
            -120.648342,
            47.560878
          ],
          [
            -120.653548,
            47.553121
          ],
          [
            -120.66168,
            47.544996
          ],
          [
            -120.677012,
            47.535138
          ]
        ],
        "type": "LineString"
      },
      "id": "4326301d898dad9243312d624e272a22"
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Tumwater Canyon"
      },
      "geometry": {
        "coordinates": [
          [
            -120.743281,
            47.665709
          ],
          [
            -120.741339,
            47.646963
          ],
          [
            -120.739121,
            47.634444
          ],
          [
            -120.736574,
            47.62387
          ],
          [
            -120.732421,
            47.612108
          ],
          [
            -120.726721,
            47.599775
          ],
          [
            -120.719859,
            47.589732
          ],
          [
            -120.708702,
            47.577318
          ]
        ],
        "type": "LineString"
      },
      "id": "888c61213efe8397c8f6c0e0e06f0ff9"
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Icicle Canyon"
      },
      "geometry": {
        "coordinates": [
          [
            -120.816014,
            47.605536
          ],
          [
            -120.806585,
            47.596012
          ],
          [
            -120.796722,
            47.586634
          ],
          [
            -120.779382,
            47.571681
          ],
          [
            -120.766336,
            47.561854
          ],
          [
            -120.754018,
            47.555196
          ],
          [
            -120.739718,
            47.550341
          ]
        ],
        "type": "LineString"
      },
      "id": "8d945c92b2947dee18ee29fd0977e90c"
    }
  ]
};

export default areasData;
