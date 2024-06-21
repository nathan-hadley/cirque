# Cirque Data

## JOSM

Scale: `cmd` + `option` + `click`
Rotate: `cmd` + `shift` + `click`
https://josm.openstreetmap.de/wiki/Help/Action/Select


## Uploading geojson to Mapbox Tiling Service using Mapbox CLI

1. Upload or Update Geojson
### Uploading new geojson
`tilesets upload-source nathanhadley <tileset-id> <geojson>`

### Updating source geojson
`tilesets upload-source nathanhadley <tileset-id> <geojson> --replace`

2. Create or Update Recipe
### Creating new tileset
`tilesets create nathanhadley.<tileset-id> --recipe <recipe> --name "<name>"`

### Update recipe
`tilesets update-recipe <tileset_id> <recipe>`

3. Publish
### Publish tileset
'tilesets publish nathanhadley.<tileset-id>'

PATH = ~/Dev/cirque/cirque-data
tilesets upload-source nathanhadley leavenworth-problems PATH/problems.geojson --replace
tilesets upload-source nathanhadley leavenworth-circuits PATH/circuits.geojson --replace
tilesets upload-source nathanhadley leavenworth-boulders PATH/boulders.geojson --replace
tilesets upload-source nathanhadley leavenworth-subarea-centers subarea-centers.geojson --replace

