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

// Paths for areas
const areasGeojsonPath = path.join(__dirname, '../areas/areas.geojson');
const areasOutputPath = path.join(__dirname, '../../react-native/assets/areas.ts');

// Paths for subareas (labels)
const subareasGeojsonPath = path.join(__dirname, '../subareas/subarea-centers.geojson');
const subareasOutputPath = path.join(__dirname, '../../react-native/assets/subareas.ts');

// Paths for subarea polygons
const subareaPolygonsGeojsonPath = path.join(__dirname, '../subareas/subareas.geojson');
const subareaPolygonsOutputPath = path.join(__dirname, '../../react-native/assets/subareas-polygons.ts');

function syncAreas() {
  const isValidation = isValidationRun();
  
  try {
    console.log('🏔️ Reading areas.geojson...');
    const areasData = readGeoJsonFile(areasGeojsonPath);
    
    const timestamp = getTimestamp(isValidation);
    
    const areasTsContent = generateTsContent({
      sourceFile: 'cirque-data/areas/areas.geojson',
      syncCommand: 'sync-areas',
      dataName: 'areas',
      description: 'area boundary',
      geometryType: 'Point',
      data: areasData,
      timestamp
    });

    if (isValidation) {
      if (isFileInSync(areasOutputPath, areasTsContent)) {
        logValidationSuccess('Areas');
        return true;
      } else {
        logValidationError('Areas', 'sync-areas');
        return false;
      }
    } else {
      writeFile(areasOutputPath, areasTsContent);
      logSuccess('areas.ts', areasData.features.length);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error syncing areas:', error.message);
    if (!isValidation) {
      process.exit(1);
    }
    return false;
  }
}

function syncSubareas() {
  const isValidation = isValidationRun();
  
  try {
    console.log('🏔️ Reading subarea-centers.geojson...');
    const subareasData = readGeoJsonFile(subareasGeojsonPath);
    
    const timestamp = getTimestamp(isValidation);
    
    const subareasTsContent = generateTsContent({
      sourceFile: 'cirque-data/subareas/subarea-centers.geojson',
      syncCommand: 'sync-areas',
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
        logValidationError('Subareas', 'sync-areas');
        return false;
      }
    } else {
      writeFile(subareasOutputPath, subareasTsContent);
      logSuccess('subareas.ts', subareasData.features.length);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error syncing subareas:', error.message);
    if (!isValidation) {
      process.exit(1);
    }
    return false;
  }
}

function syncSubareaPolygons() {
  const isValidation = isValidationRun();
  
  try {
    console.log('🏔️ Reading subareas.geojson...');
    const subareaPolygonsData = readGeoJsonFile(subareaPolygonsGeojsonPath);
    
    const timestamp = getTimestamp(isValidation);
    
    const subareaPolygonsTsContent = generateTsContent({
      sourceFile: 'cirque-data/subareas/subareas.geojson',
      syncCommand: 'sync-areas',
      dataName: 'subareaPolygons',
      description: 'subarea polygon boundary',
      geometryType: 'LineString',
      data: subareaPolygonsData,
      timestamp
    });

    if (isValidation) {
      if (isFileInSync(subareaPolygonsOutputPath, subareaPolygonsTsContent)) {
        logValidationSuccess('Subarea Polygons');
        return true;
      } else {
        logValidationError('Subarea Polygons', 'sync-areas');
        return false;
      }
    } else {
      writeFile(subareaPolygonsOutputPath, subareaPolygonsTsContent);
      logSuccess('subareas-polygons.ts', subareaPolygonsData.features.length);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error syncing subarea polygons:', error.message);
    if (!isValidation) {
      process.exit(1);
    }
    return false;
  }
}

function syncAreasAndSubareas() {
  const isValidation = isValidationRun();
  
  console.log(isValidation ? 
    '🔍 Validating areas and subareas data...' : 
    '🔄 Syncing areas and subareas data...'
  );
  
  let allSuccess = true;
  
  // Sync areas data
  const areasSuccess = syncAreas();
  allSuccess = allSuccess && areasSuccess;
  
  // Sync subareas data (labels)
  const subareasSuccess = syncSubareas();
  allSuccess = allSuccess && subareasSuccess;
  
  // Sync subarea polygons data
  const subareaPolygonsSuccess = syncSubareaPolygons();
  allSuccess = allSuccess && subareaPolygonsSuccess;
  
  return allSuccess;
}

// Run if called directly
if (require.main === module) {
  const success = syncAreasAndSubareas();
  if (!success && !isValidationRun()) {
    process.exit(1);
  }
}

module.exports = { syncAreas, syncSubareas, syncSubareaPolygons, syncAreasAndSubareas };
