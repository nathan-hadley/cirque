# Cirque Leavenworth

- [About](About.md)
- [Contributing Guidelines](Contributing.md)
- [Privacy Policy](Privacy_Policy.md)

## Data Management

### Adding new topos
- Export from Photos app
  - JPEG quality: Medium
  - Size: Medium

### Problems Data Sync

The app uses a single source of truth for problems data: `cirque-data/problems/problems.geojson`. 

**To update problems data:**

1. Edit `cirque-data/problems/problems.geojson`
2. Run sync command: `cd react-native && npm run sync-problems`
3. Commit both files: `problems.geojson` and `react-native/assets/problems.ts`

**Available commands:**
- `npm run sync-problems` - Generate TypeScript from GeoJSON
- `npm run validate-problems` - Check if files are in sync

The GitHub workflow automatically validates data sync on pull requests.
