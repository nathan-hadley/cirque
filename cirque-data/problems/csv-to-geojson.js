#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'problems.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV with proper quote handling
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse CSV
const lines = csvContent.split('\n').filter(line => line.trim());
const headerLine = lines[0];
const headers = parseCSVLine(headerLine);

console.log('CSV Headers:', headers);
console.log('Total rows:', lines.length - 1);

// Create a map of header name to index
const headerMap = {};
headers.forEach((header, index) => {
  headerMap[header.toLowerCase()] = index;
});

// Parse all rows
const features = [];
let skippedRows = 0;

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  
  if (values.length < headers.length - 2) { // Allow some flexibility
    console.warn(`Skipping row ${i}: only ${values.length} values`);
    skippedRows++;
    continue;
  }
  
  // Get values by header name
  const getValue = (name) => values[headerMap[name.toLowerCase()]] || '';
  
  const longitude = parseFloat(getValue('longitude'));
  const latitude = parseFloat(getValue('latitude'));
  
  if (isNaN(longitude) || isNaN(latitude)) {
    console.warn(`Row ${i}: Invalid coordinates - lon: ${getValue('longitude')}, lat: ${getValue('latitude')}`);
    skippedRows++;
    continue;
  }
  
  // Keep line as a stringified array (not parsed)
  const lineValue = getValue('line');
  let lineString = lineValue;
  
  // If it looks like it should be JSON but isn't valid, try to fix it
  if (lineValue && !lineValue.startsWith('[')) {
    try {
      // Try to parse and re-stringify to ensure valid JSON
      const parsed = JSON.parse(lineValue);
      lineString = JSON.stringify(parsed);
    } catch (e) {
      // Keep as-is if can't parse
      lineString = lineValue;
    }
  }
  
  // Create GeoJSON feature
  const feature = {
    type: "Feature",
    properties: {
      name: getValue('name'),
      grade: getValue('grade'),
      subarea: getValue('area'),
      topo: getValue('topo'),
      order: getValue('order'),
      line: lineString,
      description: getValue('description'),
      color: getValue('color')
    },
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude]
    }
  };
  
  // Remove empty string properties (but keep empty arrays)
  Object.keys(feature.properties).forEach(key => {
    if (feature.properties[key] === '' && key !== 'line') {
      delete feature.properties[key];
    }
  });
  
  features.push(feature);
}

// Create GeoJSON object
const geojson = {
  type: "FeatureCollection",
  generator: "JOSM",
  features: features
};

// Write to GeoJSON file
const geojsonPath = path.join(__dirname, 'problems.geojson');
fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 4), 'utf8');

console.log(`✓ Converted ${features.length} problems from CSV to GeoJSON`);
console.log(`✓ Skipped ${skippedRows} invalid rows`);
console.log(`✓ Saved to: ${geojsonPath}`);
console.log(`⚠️  Note: Please verify the output and run 'pnpm sync-data' if needed`);

