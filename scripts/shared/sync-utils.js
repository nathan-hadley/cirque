#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Shared utilities for data synchronization scripts
 */

/**
 * Clean GeoJSON data by removing non-standard properties
 * @param {Object} rawData - Raw GeoJSON data
 * @returns {Object} Clean GeoJSON FeatureCollection
 */
function cleanGeoJsonData(rawData) {
  return {
    type: rawData.type,
    features: rawData.features
  };
}

/**
 * Read and parse GeoJSON file
 * @param {string} filePath - Path to GeoJSON file
 * @returns {Object} Parsed GeoJSON data
 */
function readGeoJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`GeoJSON file not found: ${filePath}`);
  }
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return cleanGeoJsonData(rawData);
}

/**
 * Generate TypeScript file content for GeoJSON data
 * @param {Object} config - Configuration object
 * @param {string} config.sourceFile - Source GeoJSON file path
 * @param {string} config.syncCommand - Sync command name
 * @param {string} config.dataName - Name of the data (e.g., 'problems', 'circuits')
 * @param {string} config.description - Description of the data
 * @param {string} config.geometryType - TypeScript geometry type
 * @param {Object} config.data - GeoJSON data
 * @param {string} config.timestamp - Generation timestamp
 * @returns {string} TypeScript file content
 */
function generateTsContent(config) {
  const {
    sourceFile,
    syncCommand,
    dataName,
    description,
    geometryType,
    data,
    timestamp
  } = config;

  return `import { FeatureCollection, ${geometryType}, GeoJsonProperties } from 'geojson';

/*
 * Auto-generated from ${sourceFile}
 *
 * This file contains all ${description} data for the Cirque app.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * To update:
 *   1. Edit ${sourceFile}
 *   2. Run: npm run ${syncCommand}
 *   3. Commit both files
 *
 * Generated: ${timestamp}
 * Features: ${data.features.length}
 */

export const ${dataName}Data: FeatureCollection<${geometryType}, GeoJsonProperties> = ${JSON.stringify(data, null, 2)};

export default ${dataName}Data;
`;
}

/**
 * Ensure directory exists
 * @param {string} filePath - File path to check directory for
 */
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Check if generated file is in sync with source
 * @param {string} outputPath - Path to generated file
 * @param {string} expectedContent - Expected file content
 * @returns {boolean} True if in sync, false otherwise
 */
function isFileInSync(outputPath, expectedContent) {
  if (!fs.existsSync(outputPath)) {
    return false;
  }

  const existingContent = fs.readFileSync(outputPath, 'utf8');
  const existingTimestamp = existingContent.match(/Generated: (.+)/)?.[1];
  
  if (!existingTimestamp) {
    return false;
  }

  const expectedContentWithTimestamp = expectedContent.replace('VALIDATION_RUN', existingTimestamp);
  return existingContent === expectedContentWithTimestamp;
}

/**
 * Write TypeScript file with data
 * @param {string} outputPath - Output file path
 * @param {string} content - File content
 */
function writeFile(outputPath, content) {
  ensureDirectoryExists(outputPath);
  fs.writeFileSync(outputPath, content);
}

/**
 * Get timestamp for generation
 * @param {boolean} isValidation - Whether this is a validation run
 * @returns {string} Timestamp string
 */
function getTimestamp(isValidation) {
  return isValidation ? 'VALIDATION_RUN' : new Date().toISOString();
}

/**
 * Check if this is a validation run
 * @returns {boolean} True if --check flag is present
 */
function isValidationRun() {
  return process.argv.includes('--check');
}

/**
 * Log success message for generation
 * @param {string} fileName - Generated file name
 * @param {number} featureCount - Number of features
 */
function logSuccess(fileName, featureCount) {
  console.log(`✅ Generated ${fileName} with ${featureCount} features`);
}

/**
 * Log validation success
 * @param {string} dataName - Name of the data type
 */
function logValidationSuccess(dataName) {
  console.log(`✅ ${dataName} data is in sync`);
}

/**
 * Log validation error and exit
 * @param {string} dataName - Name of the data type
 * @param {string} syncCommand - Sync command to run
 */
function logValidationError(dataName, syncCommand) {
  console.error(`❌ ${dataName} data is out of sync!`);
  console.error(`   Run: npm run ${syncCommand}`);
  process.exit(1);
}

module.exports = {
  cleanGeoJsonData,
  readGeoJsonFile,
  generateTsContent,
  ensureDirectoryExists,
  isFileInSync,
  writeFile,
  getTimestamp,
  isValidationRun,
  logSuccess,
  logValidationSuccess,
  logValidationError
};