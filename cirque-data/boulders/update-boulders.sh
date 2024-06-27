#!/bin/bash

PATH="$HOME/Dev/cirque/cirque-data/boulders"
TILESET_ID="leavenworth-boulders"
GEOJSON="$PATH/boulders.geojson"
RECIPE="$PATH/boulders-recipe.json"

PYTHON="/usr/local/bin/python3"
TILESETS="/Library/Frameworks/Python.framework/Versions/3.11/bin/tilesets"

$TILESETS upload-source nathanhadley $TILESET_ID $GEOJSON --replace
if [ $? -ne 0 ]; then
  echo "Failed to upload $TILESET_ID."
  exit 1
fi

# Update the recipe and check if it succeeds
$TILESETS update-recipe nathanhadley.$TILESET_ID $RECIPE
if [ $? -ne 0 ]; then
  echo "Failed to update recipe."
  exit 1
fi

# Publish the tileset and check if it succeeds
$TILESETS publish nathanhadley.$TILESET_ID
if [ $? -ne 0 ]; then
  echo "Failed to publish $TILESET_ID."
  exit 1
fi

echo "$TILESET_ID updated successfully."