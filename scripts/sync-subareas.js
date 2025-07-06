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
const subareasGeojsonPath = path.join(__dirname, '../cirque-data/subareas/subarea-centers.geojson');
const subareasOutputPath = path.join(__dirname, '../react-native/assets/subareas.ts');

function syncSubareas() {
  const isValidation = isValidationRun();
  
  try {
    console.log('🏔️ Reading subarea-centers.geojson...');
    const subareasData = readGeoJsonFile(subareasGeojsonPath);
    
    const timestamp = getTimestamp(isValidation);
    
    const subareasTsContent = generateTsContent({
      sourceFile: 'cirque-data/subareas/subarea-centers.geojson',
      syncCommand: 'sync-subareas',
      dataName: 'subareas',
      description: 'subarea label',
      geometryType: 'Point',
      data: subareasData,
      timestamp
    });

    if (isValidation) {
      if (isFileInSync(subareasOutputPath, subareasTsContent)) {
        logValidationSuccess('Subareas');
        return true;
      } else {
        logValidationError('Subareas', 'sync-subareas');
        return false;
      }
    } else {
      writeFile(subareasOutputPath, subareasTsContent);
      logSuccess('subareas.ts', subareasData.features.length);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error syncing subareas:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncSubareas();
}

module.exports = { syncSubareas };