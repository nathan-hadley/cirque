# Boulder Problem Data Entry Tools

## Problem Entry Tool (Recommended) 🌟

**File**: `problem-entry-tool.html`

A simple, minimal-styled tool for creating new boulder problems and adding them directly to the `problems.geojson` file.

**Features**:
- Complete problem data entry form (name, grade, description, etc.)
- Interactive topo image coordinate recording
- Direct integration with problems.geojson
- Real-time data validation
- Load existing geojson files
- Download updated geojson files

**How to use**:
1. Double-click `problem-entry-tool.html` to open in your browser
2. Fill in the problem details form:
   - Name, grade, subarea, color, order (all required)
   - Description (optional)
   - Real-world coordinates (latitude/longitude)
3. Choose a topo image file
4. Click on the image to record the climbing line coordinates
5. Click "Add Problem" to add it to the dataset
6. Use "Load Existing GeoJSON" to import current problems.geojson
7. Use "Download GeoJSON" to save your updated dataset

## Legacy Image Coordinates Tool

**File**: `image-coords.html`

Simple tool for just recording image coordinates without full problem data.

**How to run**:
1. Double-click the `image-coords.html` file to open it in your browser  
2. Load an image file
3. Click on points to record coordinates
4. Copy the output for manual use

## Workflow for Adding New Problems

1. Use the **Problem Entry Tool** to create new problems
2. Load the existing `../problems/problems.geojson` file
3. Add your new problems one by one
4. Download the updated geojson file
5. Replace the original `problems.geojson` with your updated version
6. Run the React Native sync command: `cd react-native && npm run sync-problems`
