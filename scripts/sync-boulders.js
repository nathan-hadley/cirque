#!/usr/bin/env node

const path = require('path');
const {
  readGeoJsonFile,
  generateTsContent,
  isFileInSync,
  writeFile,
  getTimestamp,
  isValidationRun,
  logSuccess,
  logValidationSuccess,
  logValidationError
} = require('./shared/sync-utils');

// Paths
const bouldersGeojsonPath = path.join(__dirname, '../cirque-data/boulders/boulders.geojson');
const bouldersOutputPath = path.join(__dirname, '../react-native/assets/boulders.ts');

function syncBoulders() {
  const isValidation = isValidationRun();
  
  try {
    console.log('🪨 Reading boulders.geojson...');
    const bouldersData = readGeoJsonFile(bouldersGeojsonPath);
    
    const timestamp = getTimestamp(isValidation);
    
    const bouldersTsContent = generateTsContent({
      sourceFile: 'cirque-data/boulders/boulders.geojson',
      syncCommand: 'sync-boulders',
      dataName: 'boulders',
      description: 'boulder outline',
      geometryType: 'LineString',
      data: bouldersData,
      timestamp
    });

    if (isValidation) {
      if (isFileInSync(bouldersOutputPath, bouldersTsContent)) {
        logValidationSuccess('Boulders');
        return true;
      } else {
        logValidationError('Boulders', 'sync-boulders');
        return false;
      }
    } else {
      writeFile(bouldersOutputPath, bouldersTsContent);
      logSuccess('boulders.ts', bouldersData.features.length);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error syncing boulders:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncBoulders();
}

module.exports = { syncBoulders };