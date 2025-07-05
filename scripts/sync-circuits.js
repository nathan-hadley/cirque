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
const circuitsGeojsonPath = path.join(__dirname, '../cirque-data/circuits/circuits.geojson');
const circuitsOutputPath = path.join(__dirname, '../react-native/assets/circuits.ts');

function syncCircuits() {
  const isValidation = isValidationRun();
  
  try {
    console.log('🔄 Reading circuits.geojson...');
    const circuitsData = readGeoJsonFile(circuitsGeojsonPath);
    
    const timestamp = getTimestamp(isValidation);
    
    const circuitsTsContent = generateTsContent({
      sourceFile: 'cirque-data/circuits/circuits.geojson',
      syncCommand: 'sync-circuits',
      dataName: 'circuits',
      description: 'circuit line',
      geometryType: 'LineString',
      data: circuitsData,
      timestamp
    });

    if (isValidation) {
      if (isFileInSync(circuitsOutputPath, circuitsTsContent)) {
        logValidationSuccess('Circuits');
        return true;
      } else {
        logValidationError('Circuits', 'sync-circuits');
        return false;
      }
    } else {
      writeFile(circuitsOutputPath, circuitsTsContent);
      logSuccess('circuits.ts', circuitsData.features.length);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error syncing circuits:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncCircuits();
}

module.exports = { syncCircuits };