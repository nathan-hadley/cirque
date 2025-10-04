# Contribute Tab Implementation Plan

## Overview

Implement a comprehensive problem contribution system with offline support, form validation, image drawing functionality, and automated GitHub pull request creation.

## Current Architecture Analysis

**Existing Tab Structure**: Uses expo-router with current tabs in `react-native/app/(tabs)/_layout.tsx`

**Problem Data Format**: GeoJSON features with properties: name, grade, subarea, color, order, description, topo, line (coordinates as JSON string)

**Available Subareas**: Barney's Rubble, Clamshell Cave, Straightaways, Forestland, Swiftwater

**UI Framework**: gluestack-ui components with NativeWind styling

**State Management**: Zustand stores

**Image Handling**: Stored in `assets/topos/` with naming convention `subarea-problem-name.jpeg`

**Sync System**: Node.js scripts convert GeoJSON to TypeScript assets

## Technical Implementation Strategy

### 1. Core Dependencies to Add

#### Essential Packages
- `@react-native-async-storage/async-storage` - Offline queue persistence
- `expo-document-picker` - Image file selection from device
- `expo-image-manipulator` - Image resizing to 640x480 and format conversion
- `@react-native-community/netinfo` - Network connectivity monitoring
- `expo-secure-store` - Secure storage for GitHub credentials

#### Drawing Library  
- `@shopify/react-native-skia` - High-performance 2D graphics and drawing
  - Modern, actively maintained by Shopify
  - Excellent touch gesture handling
  - Built-in coordinate extraction
  - Cross-platform support

#### GitHub Integration
- `react-native-url-polyfill` - URL polyfill for Node.js APIs
- `jsonwebtoken` - JWT token generation for GitHub App authentication

#### Installation Commands
```bash
# Core dependencies
pnpm install @react-native-async-storage/async-storage
pnpm install expo-document-picker
pnpm install expo-image-manipulator  
pnpm install @react-native-community/netinfo
pnpm install expo-secure-store

# Drawing library
pnpm install @shopify/react-native-skia
cd ios && pod install  # iOS only

# GitHub integration helpers
pnpm install react-native-url-polyfill
pnpm install jsonwebtoken
pnpm install @types/jsonwebtoken --save-dev
```

### 2. Offline Queue Architecture

- **Queue Storage**: Use AsyncStorage to persist submission queue
- **Network Detection**: Monitor connectivity with NetInfo
- **Auto-sync**: Process queue when network available
- **Retry Logic**: Retry failed submissions up to 2 times before permanent failure
- **Failure Tracking**: Track attempt count and failure reasons for each submission
- **Exponential Backoff**: Implement increasing delays between retry attempts
- **Queue Structure**: Store form data, image data, and submission status

### 3. GitHub API Integration Strategy (GitHub App)

Primary approach: GitHub App with credentials stored via SecureStore.

```typescript
// GitHub service configuration
const GITHUB_CONFIG = {
  owner: 'your-repo-owner',
  repo: 'cirque',
  appId: 'your-app-id',
  installationId: 'your-installation-id',
  privateKey: 'your-private-key', // Stored securely
  apiUrl: 'https://api.github.com'
};

// GitHub API service
class GitHubService {
  private async getInstallationToken(): Promise<string> {
    // Generate JWT using app credentials
    // Exchange for installation access token
    // Cache token until expiry (1 hour)
  }
  
  async createBranch(branchName: string, baseSha: string): Promise<void> {
    // Create new branch from main branch
    // Branch naming: `contribution/problem-{timestamp}`
  }
  
  async commitFiles(branchName: string, files: FileChange[]): Promise<string> {
    // Commit multiple files in single commit
    // Return commit SHA
  }
  
  async createPullRequest(branchName: string, title: string, body: string): Promise<number> {
    // Create PR from fork branch to main repo
    // Return PR number
  }
}
```

#### Detailed File Operations

**Step 1: Read Current Files**
```typescript
// Get current contents of problems.geojson
const currentProblems = await githubService.getFileContent('cirque-data/problems/problems.geojson');
const problemsData = JSON.parse(atob(currentProblems.content));
```

**Step 2: Update Problems GeoJSON**
```typescript
// Add new problem to features array
const newProblem = {
  type: "Feature",
  properties: {
    name: formData.problemName,
    grade: formData.grade,
    subarea: formData.subarea,
    color: formData.color,
    order: formData.order,
    description: formData.description || "",
    topo: `${formData.subarea}-${formData.problemName.split(" ").join("-").toLowerCase()}.jpeg`,
    line: JSON.stringify(formData.coordinates)
  },
  geometry: {
    type: "Point",
    coordinates: [formData.longitude, formData.latitude]
  }
};

// Note: Contact info (submitterName, submitterEmail) only goes in PR description,
// not stored in the GeoJSON data

problemsData.features.push(newProblem);
```

**Step 3: Prepare File Changes**
```typescript
const fileChanges: FileChange[] = [
  {
    path: 'cirque-data/problems/problems.geojson',
    content: btoa(JSON.stringify(problemsData, null, 2)),
    encoding: 'base64'
  }
];

// Add image file if new topo image
if (formData.newImage) {
  fileChanges.push({
    path: `react-native/assets/topos/${formData.subarea}-${formData.problemName.split(" ").join("-").toLowerCase()}.jpeg`,
    content: formData.imageBase64,
    encoding: 'base64'
  });
}
```

#### Pull Request Details

**PR Title Format**: `Add new problem: {problem-name} in {subarea}`

**PR Description Template**:
```markdown
## New Problem Submission

**Problem Details:**
- **Name**: {problemName}
- **Grade**: {grade}  
- **Subarea**: {subarea}
- **Color**: {color}
- **Order**: {order}
- **Coordinates**: {lat}, {lng}

**Description**: {description || 'No description provided'}

**Topo Image**: {included/existing}

**Submitter Contact:**
- **Name**: {submitterName}
- **Email**: {submitterEmail}
- **Submitted**: {timestamp}

---
*This PR was automatically generated via the Cirque mobile app.*
*Contact information is provided for follow-up questions only.*
```

#### Error Handling & Rate Limiting

**Rate Limit Management**:
- Track API usage with local counter
- Implement exponential backoff for rate limit hits
- Queue submissions when limits approached
- Show user-friendly rate limit messages

**Network Error Handling**:
```typescript
const submitWithRetry = async (submission: ProblemSubmission, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await submitToGitHub(submission);
      return { success: true };
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        // Wait and retry
        await delay(Math.pow(2, attempt) * 1000);
        continue;
      }
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
};
```

#### Security & Privacy Considerations

- Store GitHub App private key in Expo SecureStore
- Validate user inputs before API calls
- Sanitize file names and paths
- Limit image sizes (max 5MB)
- Contact info appears only in PR description; not stored in GeoJSON or locally

#### GitHub App Setup Process

1) Create GitHub App with permissions: Contents (R/W), Metadata (R), Pull requests (W)
2) Install on target repository and note Installation ID
3) Generate and securely store the private key

#### Secure Credential Storage (Expo SecureStore)
```typescript
import * as SecureStore from 'expo-secure-store';

// Store credentials securely (one-time setup)
const storeGitHubCredentials = async () => {
  await SecureStore.setItemAsync('github_app_id', 'your-app-id');
  await SecureStore.setItemAsync('github_installation_id', 'your-installation-id');
  await SecureStore.setItemAsync('github_private_key', PRIVATE_KEY_STRING);
};

// Retrieve credentials
const getGitHubCredentials = async () => {
  const appId = await SecureStore.getItemAsync('github_app_id');
  const installationId = await SecureStore.getItemAsync('github_installation_id');
  const privateKey = await SecureStore.getItemAsync('github_private_key');
  
  if (!appId || !installationId || !privateKey) {
    throw new Error('GitHub credentials not configured');
  }
  
  return { appId, installationId, privateKey };
};

// GitHub service using secure credentials
class GitHubService {
  private async getInstallationToken(): Promise<string> {
    const { appId, installationId, privateKey } = await getGitHubCredentials();
    
    // Generate JWT and get installation token
    // ... rest of implementation
  }
}
```

Benefits:
- No server required; app talks directly to GitHub
- Encrypted storage via iOS Keychain/Android Keystore

Considerations:
- Credentials are device-scoped; lost on uninstall

// Development notes: use env only to embed build-time values; do not store private key in env for production

#### Simple Implementation: Direct GitHub Integration

**Streamlined approach using SecureStore:**
```typescript
class ContributionService {
  private githubService = new GitHubService();
  
  async submitProblem(problemData: ProblemSubmission): Promise<SubmissionResult> {
    try {
      // Try direct GitHub submission
      const prNumber = await this.githubService.createPullRequest(problemData);
      return { success: true, prNumber };
    } catch (error) {
      if (isNetworkError(error)) {
        // Queue for later when network is available
        await this.addToOfflineQueue(problemData);
        return { queued: true, message: 'Will submit when online' };
      }
      throw error;
    }
  }
  
  async processOfflineQueue() {
    const queuedItems = await this.getOfflineQueue();
    
    for (const item of queuedItems) {
      try {
        const prNumber = await this.githubService.createPullRequest(item.data);
        await this.removeFromQueue(item.id);
        console.log(`✅ Submitted queued item, PR #${prNumber}`);
      } catch (error) {
        console.log(`❌ Failed to submit queued item: ${error.message}`);
        // Keep in queue for next retry
      }
    }
  }
}

#### Security Best Practices & Important Considerations

**🔐 Key Security Principles:**

1. **Never hardcode secrets in source code**
   - Private keys in code = compromised immediately
   - Anyone with app bundle can extract keys
   - Use secure storage or server-side approach

2. **Understand the trade-offs:**
   ```typescript
   // ❌ NEVER DO THIS - Key visible in app bundle
   const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----...";
   
   // ✅ GOOD - Key retrieved from secure storage
   const privateKey = await SecureStore.getItemAsync('github_private_key');
   
   // ✅ BEST - Key never on device
   const result = await fetch('/api/submit', { method: 'POST', body: data });
   ```

3. **SecureStore limitations to know:**
   - Keys lost on app uninstall (need re-setup mechanism)
   - Device-specific (won't sync across user devices)  
   - Still extractable with device root/jailbreak access
   - Better than plain storage, but not perfect

**Implementation Steps:**

Step 1: Build-Time Credential Embedding
```typescript
// app.config.js - Credentials embedded at build time
export default {
  expo: {
    extra: {
      githubAppId: process.env.GITHUB_APP_ID,
      githubInstallationId: process.env.GITHUB_INSTALLATION_ID,
      githubPrivateKey: process.env.GITHUB_PRIVATE_KEY, // Base64 encoded
    }
  }
};

// In your app code
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Store credentials in SecureStore on first app launch
const initializeCredentials = async () => {
  const existing = await SecureStore.getItemAsync('github_app_id');
  if (!existing && Constants.expoConfig?.extra?.githubAppId) {
    // First launch - store the build-time credentials securely
    await SecureStore.setItemAsync('github_app_id', Constants.expoConfig.extra.githubAppId);
    await SecureStore.setItemAsync('github_installation_id', Constants.expoConfig.extra.githubInstallationId);
    await SecureStore.setItemAsync('github_private_key', Constants.expoConfig.extra.githubPrivateKey);
    console.log('✅ GitHub credentials initialized from build config');
  }
};

// Call once on app startup
useEffect(() => { initializeCredentials(); }, []);
```

Your `.env.local` (never commit):
```bash
# .env.local (add to .gitignore)
GITHUB_APP_ID=123456
GITHUB_INSTALLATION_ID=987654
GITHUB_PRIVATE_KEY=base64_encoded_private_key_here
```

**Build process:**
```bash
# Build with embedded credentials
expo build --env .env.local
```

Step 2: Runtime Usage
```typescript
class SecureGitHubService {
  private cachedToken: { token: string; expires: Date } | null = null;
  
  async getInstallationToken(): Promise<string> {
    // Check cached token first
    if (this.cachedToken && this.cachedToken.expires > new Date()) {
      return this.cachedToken.token;
    }
    
    // Get credentials from secure storage
    const credentials = await this.getStoredCredentials();
    
    // Generate new token
    const token = await this.generateToken(credentials);
    
    // Cache for 50 minutes (expires in 60)
    this.cachedToken = {
      token,
      expires: new Date(Date.now() + 50 * 60 * 1000)
    };
    
    return token;
  }
  
  private async getStoredCredentials() {
    const appId = await SecureStore.getItemAsync('github_app_id');
    const installationId = await SecureStore.getItemAsync('github_installation_id');
    const privateKey = await SecureStore.getItemAsync('github_private_key');
    
    if (!appId || !installationId || !privateKey) {
      throw new Error('GitHub App not configured. Please set up credentials.');
    }
    
    return { appId, installationId, privateKey };
  }
}
```

Step 3: Error Handling & Recovery
```typescript
const handleMissingCredentials = async () => {
  try {
    await githubService.getInstallationToken();
  } catch (error) {
    if (error.message.includes('not configured')) {
      // Show user-friendly message
      Alert.alert(
        'Setup Required',
        'GitHub integration needs to be configured. Contact support.',
        [{ text: 'OK' }]
      );
      
      // Maybe redirect to setup screen or disable contribute feature
      return false;
    }
    throw error; // Re-throw other errors
  }
  return true;
};
```

Deployment

1. **Development Environment:**
   ```bash
   # Create .env.local file (add to .gitignore)
   echo ".env.local" >> .gitignore
   
   # Add your GitHub App credentials
   cat > .env.local << EOF
   GITHUB_APP_ID=your-app-id
   GITHUB_INSTALLATION_ID=your-installation-id  
   GITHUB_PRIVATE_KEY=base64-encoded-private-key
   EOF
   ```

2. **Production Builds:**
   ```bash
   # Build with embedded credentials for App Store/Play Store
   expo build --env .env.local
   
   # Or for EAS Build
   eas build --profile production --env .env.local
   ```

3. User Experience
   ```typescript
   // App automatically initializes on first launch
   const ContributeTab = () => {
     const [isReady, setIsReady] = useState(false);
     
     useEffect(() => {
       // Credentials are automatically available from build
       initializeCredentials().then(() => setIsReady(true));
     }, []);
     
     if (!isReady) {
       return <Spinner />; // Brief loading on first launch
     }
     
     return <ContributeForm />; // Ready to use immediately
   };
   ```

4. **Security Notes:**
   - Private key embedded at build time, stored in SecureStore at runtime
   - Each app install automatically has credentials ready
   - No setup required for users
   - Credentials never exposed in source code

User Experience Summary:
- Open Contribute tab → fill form → submit
- Offline submissions are queued and auto-submitted when online
- PRs are created under the app identity; contact info only in PR description

#### User Experience Benefits

**Seamless Contribution Flow:**
1. User opens Contribute tab (no login required)
2. Fills out problem details and draws route line
3. Submits form → queued for GitHub submission
4. App automatically creates PR when online
5. User gets confirmation with PR link to track progress

**Contribution Attribution:**
- All PRs will be authored by "Cirque App" GitHub identity
- PR description includes submission details but no personal info
- Repository maintainers can review and merge contributions
- Users can be notified of PR status via in-app notifications

### 4. Image Drawing Implementation

#### Chosen Library: @shopify/react-native-skia

**Rationale**: 
- Modern, actively maintained by Shopify team
- High-performance 2D graphics using Google's Skia engine
- Excellent touch event handling for drawing
- Built-in coordinate extraction capabilities
- Cross-platform compatibility (iOS/Android)
- Strong TypeScript support

**Installation**:
```bash
npm install @shopify/react-native-skia
cd ios && pod install  # iOS only
```

**Drawing Implementation**:
- **Touch Gesture Handling**: Use Skia's gesture system to track finger movements
- **Path Creation**: Build SVG-style paths from touch coordinates
- **Coordinate Extraction**: Sample 6 equally-spaced points from completed path
- **Coordinate Scaling**: Convert touch coordinates to image coordinate system using image dimensions
- **Line Rendering**: Display smooth bezier curves following touch input
- **Clear/Undo**: Reset canvas state and path data

**Code Structure**:
```typescript
// Drawing component using Skia
import { Canvas, Path, useValue, useTouchHandler } from '@shopify/react-native-skia';

const DrawingCanvas = ({ imageDimensions, onPathComplete }) => {
  const path = useValue(Skia.Path.Make());
  
  const touchHandler = useTouchHandler({
    onStart: (pt) => {
      // Start new path
      path.current.moveTo(pt.x, pt.y);
    },
    onActive: (pt) => {
      // Add point to path
      path.current.lineTo(pt.x, pt.y);
    },
    onEnd: () => {
      // Extract 6 equally-spaced coordinates
      const coordinates = extractCoordinates(path.current, imageDimensions);
      onPathComplete(coordinates);
    }
  });
  
  return (
    <Canvas style={{ flex: 1 }} onTouch={touchHandler}>
      <Path path={path} color="red" strokeWidth={3} />
    </Canvas>
  );
};
```

**Coordinate Processing**:
- Extract points at 0%, 20%, 40%, 60%, 80%, 100% along path
- Scale coordinates from canvas dimensions to original image dimensions
- Format as JSON string matching existing problem data structure

## Implementation Details

### Form Fields and Validation

- **Contact Information**: 
  - Submitter Name (required) - For follow-up if needed
  - Email Address (required) - For questions about the submission
- **Problem Details**:
  - Problem Name (required)
  - Grade (required) - V0-V12, Low 5th
  - Subarea (required) - Dropdown + manual entry option
  - Color (required) - Black, Blue, Red, White
  - Order (required) - Numeric position on problem
  - Coordinates (required) - Manual entry with format validation OR current location button
- **Optional Fields**: 
  - Description - Additional route details
- **Image Handling**: 640x480 resize, existing topo search, new image upload
- **Validation**: Real-time validation with error states using gluestack-ui patterns
- **Privacy Note**: Contact info only used for submission follow-up, not stored locally

### File Structure

```
react-native/app/(tabs)/contribute.tsx - Main contribute screen
react-native/components/contribute/
  - ContributeForm.tsx - Main form component
  - ImageDrawingCanvas.tsx - Drawing functionality
  - SubareaSelector.tsx - Subarea selection with manual entry
  - CoordinateInput.tsx - Location input component
  - OfflineQueueStatus.tsx - Queue status display
react-native/stores/contributeStore.ts - Contribution state management
react-native/services/
  - githubService.ts - GitHub API integration
  - offlineQueueService.ts - Queue management
  - imageService.ts - Image processing
```

### Data Flow

1. **Form Submission** → Validate contact info and problem data → Process image → Generate line coordinates → Store in offline queue (contact info + problem details)
2. **Network Available** → Process queue → Create GitHub branch → Commit files → Create PR with contact info in description → Update queue status
3. **Offline Mode** → Store in queue → Show queue status → Process when online

**Privacy Handling**:
- Contact information only used for PR description (visible to maintainers)
- Not stored in GeoJSON data or local app storage
- Only transmitted once during submission
- Users informed of contact info usage in form

## Technical Considerations

### Security & Authentication

- Store GitHub token in Expo SecureStore
- Implement proper input validation and sanitization
- Rate limiting for GitHub API calls

### Error Handling

- Network timeout handling
- GitHub API error responses
- Image processing failures
- Form validation errors
- Queue corruption recovery

### Performance

- Image compression for uploads
- Efficient coordinate calculation
- Minimal re-renders during drawing
- Background queue processing

### User Experience

- Clear offline/online status indicators
- Queue management visibility
- Progress feedback during submission
- Intuitive drawing interface
- Form auto-save functionality

## Implementation Phases

### Phase 1: Foundation & Setup
**Goal: Get basic infrastructure ready**

- [ ] **1.1** Create GitHub App and configure credentials
  - Create GitHub App with required permissions
  - Generate private key and installation ID
  - Set up `.env.local` with credentials (gitignored)
- [ ] **1.2** Install required dependencies
  ```bash
  pnpm install @react-native-async-storage/async-storage
  pnpm install expo-document-picker expo-image-manipulator expo-secure-store
  pnpm install @react-native-community/netinfo
  pnpm install @shopify/react-native-skia
  pnpm install react-native-url-polyfill jsonwebtoken @types/jsonwebtoken --save-dev
  ```
- [ ] **1.3** Configure build-time credential embedding
  - Update `app.config.ts` to read environment variables
  - Test credential initialization on first app launch

### Phase 2: Core Services & State Management
**Goal: Build the backend services and data flow**

- [ ] **2.1** Create contribution Zustand store
  - Form state management
  - Submission status tracking
  - Error state handling
- [ ] **2.2** Implement offline queue service
  - AsyncStorage persistence for submissions
  - Network connectivity monitoring with NetInfo
  - Queue processing with retry logic
- [ ] **2.3** Build GitHub API service
  - JWT token generation and caching
  - Repository file operations (read/update problems.geojson)
  - Branch creation and pull request generation
  - Error handling and rate limiting

#### How to Test GitHub Service Actions (Manual/Mocked)

Since GitHub calls are external, unit tests should mock `fetch` and `expo-secure-store`. Here’s how to manually verify without hitting real GitHub, plus how to structure mocks:

1. Configure Jest Mocks

```ts
// jest.setup.ts (already configured)
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockImplementation(async (key) => {
    if (key === "github_app_id") return "123";
    if (key === "github_installation_id") return "456";
    if (key === "github_private_key") return "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----";
    return null;
  }),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// mock fetch responses for token, content, tree/commit, and PR endpoints
(global as any).fetch = jest.fn(async (url, init) => {
  if (String(url).includes("/access_tokens")) {
    return new Response(JSON.stringify({ token: "x", expires_at: new Date(Date.now()+3600000).toISOString() }), { status: 200 });
  }
  if (String(url).includes("/repos/") && String(url).endsWith("/contents/cirque-data/problems/problems.geojson")) {
    const content = Buffer.from(JSON.stringify({ type: "FeatureCollection", features: [] })).toString("base64");
    return new Response(JSON.stringify({ content, sha: "sha-geojson" }), { status: 200 });
  }
  // add cases for blobs, trees, commits, refs, and pulls as needed
  return new Response("{}", { status: 200 });
});
```

2. Unit Test Structure (Examples)

- `getInstallationToken()`
  - Mock SecureStore values and `/access_tokens` fetch
  - Assert Authorization header uses JWT (cannot fully validate signature in test)
  - Assert token caching by calling twice and checking only one network request

- `getFileContent(path)`
  - Mock 404 to return null
  - Mock 200 with `{ content, sha }` and ensure pass-through

- `createBranch/commitFiles/createPullRequest`
  - Stub Git data API endpoints and assert request shapes (refs, blobs, tree entries, commit message, head/base values)

3. Manual End-to-End Test (Against Real GitHub)

- Prereqs: Set `github_app_id`, `github_installation_id`, `github_private_key` in SecureStore at runtime (e.g., via your initialization flow)
- Temporarily point `GitHubService` to a test repository you control
- Add console logging and run in a dev client on a real device/emulator
- Steps:
  1. Call `getInstallationToken()` and verify a 200 response
  2. Call `getFileContent('cirque-data/problems/problems.geojson')`
  3. Create a temporary branch via `createBranch('contribution/test', baseSha)`
  4. Commit a trivial file via `commitFiles()`
  5. Open a PR via `createPullRequest()` and verify on GitHub

4. Safety Notes

- Never commit real credentials; prefer SecureStore at runtime
- Use a sandbox repository for real calls
- Clean up test branches/PRs after verification

### Phase 3: UI Components & Form
**Goal: Create the user interface**

- [ ] **3.1** Create Contribute tab structure
  - Add contribute route to `(tabs)/_layout.tsx`
  - Create basic `contribute.tsx` screen
  - Set up navigation and tab icon
- [ ] **3.2** Build form components
  - Contact information fields (name, email)
  - Problem details form (name, grade, subarea, color, order)
  - Coordinate input with current location button
  - Form validation using existing patterns
- [ ] **3.3** Implement image handling
  - Document picker for existing topo selection
  - Image resizing to 640x480 using expo-image-manipulator
  - Topo filename generation and validation

### Phase 4: Drawing Canvas Integration
**Goal: Add route drawing functionality**

- [ ] **4.1** Implement Skia drawing canvas
  - Set up touch gesture handling
  - Path creation and rendering
  - Clear/undo functionality
- [ ] **4.2** Coordinate extraction system
  - Sample 6 equally-spaced points from drawn path
  - Scale coordinates from canvas to image dimensions
  - Format coordinates as JSON string for GeoJSON

### Phase 5: Integration & Submission Flow
**Goal: Connect all pieces together**

- [ ] **5.1** Connect form to services
  - Form submission to offline queue
  - Image processing and coordinate generation
  - Validation and error handling
- [ ] **5.2** Implement submission processing
  - Queue processing when network available
  - GitHub PR creation with contact info
  - Success/failure feedback to users
- [ ] **5.3** Add offline queue management UI
  - Queue status display component
  - Submission history and retry options
  - Network status indicators

### Phase 6: Testing & Polish
**Goal: Ensure reliability and great UX**

- [ ] **6.1** Comprehensive testing
  - Test offline/online scenarios
  - Network interruption handling
  - Form validation edge cases
  - Drawing canvas on different screen sizes
- [ ] **6.2** Error handling & recovery
  - GitHub API error responses
  - Image processing failures
  - Queue corruption recovery
  - User-friendly error messages
- [ ] **6.3** Performance optimization
  - Image compression efficiency
  - Drawing performance on older devices
  - Background queue processing
  - Memory usage optimization
- [ ] **6.4** User experience polish
  - Loading states and progress indicators
  - Haptic feedback for drawing
  - Form auto-save functionality
  - Success animations and feedback

### Phase 7: Deployment Preparation
**Goal: Ready for production**

- [ ] **7.1** Production build testing
  - Test build with embedded credentials
  - Verify SecureStore initialization
  - End-to-end submission flow testing
- [ ] **7.2** Documentation and monitoring
  - Add contribution guidelines for PR reviewers
  - Set up basic analytics for submission success rates
  - Create troubleshooting guide for common issues
