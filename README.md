# Cirque Leavenworth

- [About](About.md)
- [Contributing Guidelines](Contributing.md)
- [Privacy Policy](Privacy_Policy.md)

## Backend and Ops Docs

- [Online Setup (dashboards, DNS, secrets)](docs/online-setup.md)
- [Cloudflare Worker Setup (Wrangler + deploy)](docs/cloudflare-worker-setup.md)
- [MailerSend Setup and Usage](docs/mailersend-setup.md)

## Data Management

### Adding new topos

- Export from Photos app
  - JPEG quality: Medium
  - Size: Medium

### Problems Data Sync

The app uses a single source of truth for problems data: `cirque-data/problems/problems.geojson`.

**Problem Submission Workflow:**

1. **Automatic (via app)**: Users submit problems through the Contribute screen

   - API automatically creates a GitHub PR with the new problem
   - GitHub Action automatically runs `pnpm sync-data` and commits TypeScript files
   - PR is ready to review and merge!
   - See [GitHub PR Automation](docs/github-pr-automation.md) for details

2. **Manual (via PR)**: Edit `cirque-data/problems/problems.geojson` in a PR
   - GitHub Action automatically runs `pnpm sync-data` and commits TypeScript files
   - No need to manually sync!

3. **Manual (local)**: Edit `cirque-data/problems/problems.geojson` locally
   - Run sync command: `cd react-native && pnpm run sync-problems`
   - Commit both files: `problems.geojson` and `react-native/assets/problems.ts`

**Available commands:**

- `pnpm run sync-problems` - Generate TypeScript from GeoJSON
- `pnpm run validate-problems` - Check if files are in sync

The GitHub workflow automatically validates data sync on pull requests.
