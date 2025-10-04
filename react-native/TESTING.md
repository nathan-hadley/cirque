## Testing Guide

### Unit Tests Included (No External APIs)

- Offline Queue Service: `services/__tests__/offlineQueueService.test.ts`
  - Persists queue items in AsyncStorage
  - Processes queue on connectivity
  - Retries failures and marks items failed after max retries

- Contribute Store: `stores/__tests__/contributeStore.test.ts`
  - Enqueues submissions via the offline queue service
  - Triggers queue processing action

Run the tests:

```bash
pnpm test
```

### How to Test GitHub Service Actions

The `GitHubService` interacts with the GitHub REST API. To keep unit tests offline and predictable, mock both `fetch` and `expo-secure-store`.

1) Mocking setup (already configured in `jest.setup.ts`):

```ts
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Example fetch mock per test
global.fetch = jest.fn().mockImplementation(async (url: string, init?: RequestInit) => {
  if (url.includes("/access_tokens")) {
    return new Response(JSON.stringify({ token: "mock-token", expires_at: new Date(Date.now()+3600000).toISOString() }), { status: 200 });
  }
  return new Response("{}", { status: 200 });
});
```

2) What to assert:
- `getInstallationToken()` caches the token; call twice and ensure one network request
- `getFileContent(path)` returns `null` for 404 and `{ content, sha }` for 200
- `createBranch`, `commitFiles`, and `createPullRequest` send correct payloads

3) Manual End-to-End (against a sandbox repo):
- Prereqs: Store `github_app_id`, `github_installation_id`, and `github_private_key` via your runtime initialization flow
- Point `GitHubService` to a personal test repo
- Steps:
  - Fetch an installation token
  - Read `cirque-data/problems/problems.geojson`
  - Create a branch, commit a small change, and open a PR
- Clean up test branches/PRs afterwards

Notes:
- Never commit real credentials
- Prefer SecureStore and environment variables for local dev
