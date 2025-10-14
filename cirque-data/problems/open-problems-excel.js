#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Read the GeoJSON file
const geojsonPath = path.join(__dirname, 'problems.geojson');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Extract features and flatten to rows
const rows = geojson.features.map(feature => {
  const props = feature.properties;
  const coords = feature.geometry.coordinates;
  
  return {
    name: props.name || '',
    order: props.order || '',
    color: props.color || '',
    area: props.area || props.subarea || '', // Use 'area' if exists, fallback to 'subarea'
    grade: props.grade || '',
    description: props.description || '',
    topo: props.topo || '',
    line: props.line || '',
    longitude: coords[0],
    latitude: coords[1]
  };
});

// Sort by order (numeric), then color (alphabetic), then area (alphabetic)
rows.sort((a, b) => {
  // First compare by order (treat as numbers)
  const orderA = parseInt(a.order) || 0;
  const orderB = parseInt(b.order) || 0;
  if (orderA !== orderB) return orderA - orderB;
  
  // Then by color
  if (a.color !== b.color) return a.color.localeCompare(b.color);
  
  // Finally by area
  return a.area.localeCompare(b.area);
});

// Convert to CSV
const headers = ['name', 'order', 'color', 'area', 'grade', 'description', 'topo', 'line', 'longitude', 'latitude'];
const csvRows = [
  headers.join(','),
  ...rows.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  )
];

const csv = csvRows.join('\n');

// Write to temp CSV file
const csvPath = path.join(__dirname, 'problems-sorted.csv');
fs.writeFileSync(csvPath, csv, 'utf8');

console.log(`✓ Converted ${rows.length} problems to CSV`);
console.log(`✓ Sorted by: order → color → area`);
console.log(`✓ Saved to: ${csvPath}`);
console.log(`✓ Opening in Excel...`);

// Open in Excel (macOS 'open' command works with CSV files)
exec(`open "${csvPath}"`, (error) => {
  if (error) {
    console.error('Error opening file:', error);
    console.log('You can manually open:', csvPath);
  }
});

