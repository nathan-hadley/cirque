#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const geojsonPath = path.join(__dirname, '../cirque-data/problems/problems.geojson');
const outputPath = path.join(__dirname, '../react-native/assets/problems.ts');

// Check if this is a validation run (--check flag)
const isValidation = process.argv.includes('--check');

try {
  console.log('📋 Reading problems.geojson...');
  const rawGeojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  
  // Create a clean FeatureCollection object that excludes non-standard properties like "generator"
  const geojsonData = {
    type: rawGeojsonData.type,
    features: rawGeojsonData.features
  };
  
  // Use a stable timestamp for validation, current timestamp for generation
  const timestamp = isValidation ? 'VALIDATION_RUN' : new Date().toISOString();
  
  const tsContent = `import { FeatureCollection, Point, GeoJsonProperties } from 'geojson';

/*
 * Auto-generated from cirque-data/problems/problems.geojson
 *
 * This file contains all climbing problems data for the Cirque app.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * To update:
 *   1. Edit cirque-data/problems/problems.geojson
 *   2. Run: npm run sync-problems
 *   3. Commit both files
 *
 * Generated: ${timestamp}
 * Features: ${geojsonData.features.length}
 */

export const problemsData: FeatureCollection<Point, GeoJsonProperties> = ${JSON.stringify(geojsonData, null, 2)};

export default problemsData;
`;

  // Ensure assets directory exists
  const assetsDir = path.dirname(outputPath);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  if (isValidation) {
    // Check if files are in sync
    if (fs.existsSync(outputPath)) {
      const existingContent = fs.readFileSync(outputPath, 'utf8');
      // For validation, we need to compare against what the generated content would be
      // but using the existing timestamp from the file
      const existingTimestamp = existingContent.match(/Generated: (.+)/)?.[1];
      if (existingTimestamp) {
        const expectedContent = tsContent.replace('VALIDATION_RUN', existingTimestamp);
        if (existingContent === expectedContent) {
          console.log('✅ Problems data is in sync');
          process.exit(0);
        }
      }
      console.error('❌ Problems data is out of sync!');
      console.error('   The TypeScript file does not match the GeoJSON source.');
      console.error('   Run: npm run sync-problems');
      process.exit(1);
    } else {
      console.error('❌ Problems TypeScript file is missing!');
      console.error('   Run: npm run sync-problems');
      process.exit(1);
    }
  } else {
    // Write the TypeScript file
    fs.writeFileSync(outputPath, tsContent);
    console.log(`✅ Generated problems.ts with ${geojsonData.features.length} features`);
    console.log('   App will use the latest data on next reload.');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} 