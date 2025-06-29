#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const problemsGeojsonPath = path.join(__dirname, '../cirque-data/problems/problems.geojson');
const problemsOutputPath = path.join(__dirname, '../react-native/assets/problems.ts');
const bouldersGeojsonPath = path.join(__dirname, '../cirque-data/boulders/boulders.geojson');
const bouldersOutputPath = path.join(__dirname, '../react-native/assets/boulders.ts');

// Check if this is a validation run (--check flag)
const isValidation = process.argv.includes('--check');

try {
  // Process problems data
  console.log('📋 Reading problems.geojson...');
  const rawProblemsData = JSON.parse(fs.readFileSync(problemsGeojsonPath, 'utf8'));
  
  // Create a clean FeatureCollection object that excludes non-standard properties like "generator"
  const problemsData = {
    type: rawProblemsData.type,
    features: rawProblemsData.features
  };
  
  // Process boulders data
  console.log('🪨 Reading boulders.geojson...');
  const rawBouldersData = JSON.parse(fs.readFileSync(bouldersGeojsonPath, 'utf8'));
  
  // Create a clean FeatureCollection object that excludes non-standard properties like "generator"
  const bouldersData = {
    type: rawBouldersData.type,
    features: rawBouldersData.features
  };
  
  // Use a stable timestamp for validation, current timestamp for generation
  const timestamp = isValidation ? 'VALIDATION_RUN' : new Date().toISOString();
  
  const problemsTsContent = `import { FeatureCollection, Point, GeoJsonProperties } from 'geojson';

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
 * Features: ${problemsData.features.length}
 */

export const problemsData: FeatureCollection<Point, GeoJsonProperties> = ${JSON.stringify(problemsData, null, 2)};

export default problemsData;
`;

  const bouldersTsContent = `import { FeatureCollection, LineString, GeoJsonProperties } from 'geojson';

/*
 * Auto-generated from cirque-data/boulders/boulders.geojson
 *
 * This file contains all boulder outline data for the Cirque app.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 *
 * To update:
 *   1. Edit cirque-data/boulders/boulders.geojson
 *   2. Run: npm run sync-problems
 *   3. Commit both files
 *
 * Generated: ${timestamp}
 * Features: ${bouldersData.features.length}
 */

export const bouldersData: FeatureCollection<LineString, GeoJsonProperties> = ${JSON.stringify(bouldersData, null, 2)};

export default bouldersData;
`;

  // Ensure assets directory exists
  const assetsDir = path.dirname(problemsOutputPath);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  if (isValidation) {
    // Check if problems file is in sync
    let problemsInSync = false;
    if (fs.existsSync(problemsOutputPath)) {
      const existingProblemsContent = fs.readFileSync(problemsOutputPath, 'utf8');
      const existingProblemsTimestamp = existingProblemsContent.match(/Generated: (.+)/)?.[1];
      if (existingProblemsTimestamp) {
        const expectedProblemsContent = problemsTsContent.replace('VALIDATION_RUN', existingProblemsTimestamp);
        if (existingProblemsContent === expectedProblemsContent) {
          problemsInSync = true;
        }
      }
    }

    // Check if boulders file is in sync
    let bouldersInSync = false;
    if (fs.existsSync(bouldersOutputPath)) {
      const existingBouldersContent = fs.readFileSync(bouldersOutputPath, 'utf8');
      const existingBouldersTimestamp = existingBouldersContent.match(/Generated: (.+)/)?.[1];
      if (existingBouldersTimestamp) {
        const expectedBouldersContent = bouldersTsContent.replace('VALIDATION_RUN', existingBouldersTimestamp);
        if (existingBouldersContent === expectedBouldersContent) {
          bouldersInSync = true;
        }
      }
    }

    if (problemsInSync && bouldersInSync) {
      console.log('✅ Problems and boulders data are in sync');
      process.exit(0);
    } else {
      if (!problemsInSync) {
        console.error('❌ Problems data is out of sync!');
      }
      if (!bouldersInSync) {
        console.error('❌ Boulders data is out of sync!');
      }
      console.error('   Run: npm run sync-problems');
      process.exit(1);
    }
  } else {
    // Write the TypeScript files
    fs.writeFileSync(problemsOutputPath, problemsTsContent);
    fs.writeFileSync(bouldersOutputPath, bouldersTsContent);
    console.log(`✅ Generated problems.ts with ${problemsData.features.length} features`);
    console.log(`✅ Generated boulders.ts with ${bouldersData.features.length} features`);
    console.log('   App will use the latest data on next reload.');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} 