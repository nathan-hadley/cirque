# Cirque Data

## JOSM

Scale: `cmd` + `option` + `click`
Rotate: `cmd` + `shift` + `click`
https://josm.openstreetmap.de/wiki/Help/Action/Select


## Uploading geojson to Mapbox Tiling Service using Mapbox CLI

### Uploading new geojson
`tilesets upload-source nathanhadley <tileset-id> <geojson>`

### Updating source geojson
`tilesets upload-source nathanhadley <tileset-id> <geojson> --replace`

### Creating new tileset
`tilesets create nathanhadley.<tileset-id> --recipe <recipe> --name "<name>"`

### Publish tileset
'tilesets publish nathanhadley.<tileset-id>'
