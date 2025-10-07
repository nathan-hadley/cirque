# Contribute Tab Implementation Plan

## Overview
Build a contribute flow that lets users submit new problems (with offline support, drawing on images, and automatic GitHub PR creation). Keep it simple, resilient, and secure.

## Current Architecture Snapshot
- **Tabs**: `react-native/app/(tabs)/_layout.tsx`
- **Problem format**: GeoJSON Feature with `properties` (name, grade, subarea, color, order, description, topo, line as JSON string) and `geometry` Point
- **Subareas**: Barney's Rubble, Clamshell Cave, Straightaways, Forestland, Swiftwater
- **UI**: gluestack-ui + NativeWind; **State**: Zustand
- **Topos**: `react-native/assets/topos/` using `{subarea}-{problem-name}.jpeg`
- **Sync**: Node scripts convert GeoJSON to TS assets

## Scope and Key Decisions
- **Offline-first**: Queue submissions locally; auto-sync when online; limited retries with backoff
- **Drawing**: Use Skia for fast path drawing and coordinate extraction (6 points, scaled to image size)
- **GitHub**: Create PRs via GitHub App credentials; commit GeoJSON + optional image
- **Privacy**: Contact info only in PR description; never stored in GeoJSON
- **Security**: Secrets stored via SecureStore; no secrets in source

## Data Flow
1. User fills form → validates → picks/edits image → draws line (6 points extracted and scaled)
2. Submission saved to offline queue (problem + contact + image payload)
3. When network available → create branch → update `problems.geojson` → add image if needed → open PR (contact info only in PR body)
4. Show status and PR link on success; keep/retry on failure

## Minimal Interfaces (conceptual)
```ts
// Submission payload (conceptual)
interface ProblemSubmission {
  contact: { name: string; email: string };
  problem: {
    name: string; grade: string; subarea: string; color: string; order: number;
    description?: string; lat: number; lng: number; line: number[][]; // 6 points
    topoFilename?: string; imageBase64?: string; // if new image
  };
}
```

## GitHub Integration (essentials)
- Use a GitHub App installation token (cached ~50 min)
- Operations: read/modify `cirque-data/problems/problems.geojson`, add image under `react-native/assets/topos/`, create branch, commit, open PR
- PR title: `Add new problem: {name} in {subarea}`; PR body includes contact info and metadata

## Offline Queue (essentials)
- Store queue items with status, attempt count, and last error
- Trigger processing on connectivity changes and app focus
- Exponential backoff; cap retries; surface actionable errors to user

## Form and Validation (essentials)
- Required: name, email, problem name, grade, subarea, color, order, coordinates
- Optional: description; image (resize for consistency)
- Validation: format checks, safe filename generation, clear inline errors

## File Structure (target)
```
react-native/app/(tabs)/contribute.tsx                # Screen
react-native/components/contribute/ContributeForm.tsx
react-native/components/contribute/ImageDrawingCanvas.tsx
react-native/components/contribute/SubareaSelector.tsx
react-native/components/contribute/CoordinateInput.tsx
react-native/components/contribute/OfflineQueueStatus.tsx
react-native/stores/contributeStore.ts
react-native/services/githubService.ts
react-native/services/offlineQueueService.ts
react-native/services/imageService.ts
```

## Security and Privacy (non-negotiables)
- Store GitHub App credentials only in SecureStore (initialized at first launch from build-time env)
- Do not embed secrets in source code; never include contact info in GeoJSON
- Enforce image size limits; sanitize filenames/paths; validate inputs

## Implementation Phases

### Phase 1: Foundation
- Create GitHub App and configure credentials (contents: read/write; pull requests: write)
- Build-time env → initialize to SecureStore on first launch

### Phase 2: Services and State
- Contribution store (form state, submission state)
- Offline queue service (persistence, net monitoring, retries)
- GitHub service (token, file ops, PR creation)

### Phase 3: UI
- Contribute tab route and screen
- Form components (contact, problem details, coordinate input, validation)
- Image handling (picker, resize, filename generation)

### Phase 4: Drawing
- Skia canvas for path drawing; clear/undo
- Extract 6 evenly spaced points; scale to image dimensions

### Phase 5: Wiring and Submission
- Connect form → queue → GitHub PR flow
- Queue processing with success/failure feedback and PR link

### Phase 6: Testing and Polish
- Offline/online transitions; interruption handling
- Error handling paths and user messages
- Performance: compression, drawing perf, background processing
- UX polish: loading/progress, autosave, success feedback

### Phase 7: Release Readiness
- Production build sanity checks (credentials init, end-to-end PR)
- Reviewer playbook and basic monitoring (submission success rate)

## Notes
- Keep commands and setup docs out of this plan; maintain them in contributor docs
- This plan focuses on responsibilities, data shapes, and integration touchpoints only
