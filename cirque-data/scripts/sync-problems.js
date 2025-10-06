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
const problemsGeojsonPath = path.join(__dirname, '../problems/problems.geojson');
const problemsOutputPath = path.join(__dirname, '../../react-native/assets/problems.ts');

function syncProblems() {
  const isValidation = isValidationRun();
  
  try {
    console.log('📋 Reading problems.geojson...');
    const problemsData = readGeoJsonFile(problemsGeojsonPath);
    
    const timestamp = getTimestamp(isValidation);
    
    const problemsTsContent = generateTsContent({
      sourceFile: 'cirque-data/problems/problems.geojson',
      syncCommand: 'sync-problems',
      dataName: 'problems',
      description: 'climbing problems',
      geometryType: 'Point',
      data: problemsData,
      timestamp
    });

    if (isValidation) {
      if (isFileInSync(problemsOutputPath, problemsTsContent)) {
        logValidationSuccess('Problems');
        return true;
      } else {
        logValidationError('Problems', 'sync-problems');
        return false;
      }
    } else {
      writeFile(problemsOutputPath, problemsTsContent);
      logSuccess('problems.ts', problemsData.features.length);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error syncing problems:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncProblems();
}

module.exports = { syncProblems };