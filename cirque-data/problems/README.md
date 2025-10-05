# Boulder Problem Data Entry Tool

**How to use**:
1. Double-click `problem-entry-tool.html` in Finder to open in your browser
2. Fill in the problem details form:
   - Name, grade, subarea, color, order (all required)
   - Description (optional)
   - Real-world coordinates (latitude/longitude)
3. Choose a topo image file
4. Click on the image to record the climbing line coordinates
5. Click "Add Problem" to add it to the dataset
6. Use "Load Existing GeoJSON" to import current problems.geojson
7. Use "Download GeoJSON" to save your updated dataset
8. Save new problems.geojson to repo
9. Run data sync script (`pnpm data-sync`) to update `problems.ts`
10. Enusre images are linked in 


