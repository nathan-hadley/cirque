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
- `crypto-js` or built-in crypto - Cryptographic operations for request signing

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

### 3. GitHub API Integration Strategy

#### Authentication Approach: GitHub App

**Why GitHub App is Perfect for This Use Case:**
- **No user accounts required** - Users don't need GitHub accounts to contribute
- **App acts as single contributor** - All PRs come from the Cirque app identity
- **Better rate limiting** - 5,000 requests/hour vs 60 for unauthenticated
- **More secure** - No user credentials to manage or store
- **Simplified UX** - Users just fill out the form and submit
- **Centralized management** - All contributions appear from one trusted source

**Implementation Details:**

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
  
  async createFork(): Promise<string> {
    // Fork the main repository to app's account
    // Return fork's full name
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

**Security:**
- Store GitHub App private key in Expo SecureStore
- Validate all user inputs before API calls
- Sanitize file names and paths (spaces to hyphens, lowercase)
- Limit file sizes (images max 5MB)
- Implement request signing for sensitive operations

**Privacy:**
- Contact information only included in PR descriptions for maintainer follow-up
- Not stored permanently in app or GeoJSON data
- Clear privacy notice on form about contact info usage
- Email validation to ensure valid contact method

#### GitHub App Setup Process

**1. Create GitHub App**
- Navigate to GitHub Settings → Developer settings → GitHub Apps
- Click "New GitHub App" with these settings:
  - Name: "Cirque Problem Contributions"
  - Homepage URL: Your app's URL or repository
  - Webhook: Not required for this use case
  - Permissions:
    - Repository permissions:
      - Contents: Read & Write (to modify files)
      - Metadata: Read (to access repository info)
      - Pull requests: Write (to create PRs)
    - Account permissions: None needed
  - Where can this GitHub App be installed: Only on this account

**2. Configure App Installation**  
- Install the app on your repository
- Note the Installation ID from the installation URL
- Generate and download private key (keep secure!)

**3. Secure Configuration Storage**

#### Primary Approach: Expo SecureStore (Recommended for Your Use Case)

**Direct GitHub integration without needing a server:**
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

**SecureStore Benefits for Your Use Case**:
- **No server required**: Direct GitHub API integration
- **Strong encryption**: Uses iOS Keychain and Android Keystore
- **App-specific**: Cannot be accessed by other apps
- **Persistent**: Survives app updates
- **Offline-ready**: Perfect for remote climbing areas

**Considerations**:
- Credentials lost on app uninstall (need setup flow)
- Device-specific (each install needs setup)
- Extractable with device root/jailbreak (rare scenario)

#### Alternative: Environment Variables (Development Only)

**For non-production or when server proxy isn't feasible:**
```typescript
// .env file (never commit to git!)
GITHUB_APP_ID=123456
GITHUB_INSTALLATION_ID=987654
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END RSA PRIVATE KEY-----"

// expo-constants configuration
// app.config.js
export default {
  expo: {
    extra: {
      githubAppId: process.env.GITHUB_APP_ID,
      githubInstallationId: process.env.GITHUB_INSTALLATION_ID,
      // DON'T PUT PRIVATE KEY HERE - too risky
    }
  }
};

// Access in app
import Constants from 'expo-constants';

const GITHUB_CONFIG = {
  appId: Constants.expoConfig?.extra?.githubAppId,
  installationId: Constants.expoConfig?.extra?.githubInstallationId,
  // Private key would need to come from SecureStore
};
```

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

**🛠️ Practical Implementation Steps:**

**Step 1: Build-Time Credential Embedding (Users Never See This)**
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

// Call this on app startup
useEffect(() => {
  initializeCredentials();
}, []);
```

**Your .env file (NEVER commit this):**
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

**Step 2: Runtime Usage**
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

**Step 3: Error Handling & Recovery**
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

**🚀 Deployment Strategy:**

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

3. **User Experience (Completely Seamless):**
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

**💡 Final Implementation Approach:**

**Build-Time Embedding** - Perfect for your use case:
- ✅ **No server needed**: Keep your serverless architecture
- ✅ **No user setup**: Credentials embedded when you build the app
- ✅ **Secure storage**: Uses iOS Keychain/Android Keystore encryption
- ✅ **Simple for users**: They just use the contribute feature, no setup
- ✅ **Simple for you**: Configure once in your build environment
- ✅ **Offline-first**: Perfect for climbers in remote areas

**User Experience:**
- Download app from App Store/Play Store
- Open Contribute tab - works immediately
- No GitHub account needed, no setup required
- All contributions automatically create PRs under "Cirque App" identity

**Your Implementation Steps:**
1. Create GitHub App (5 minutes)
2. Add credentials to `.env.local` file (gitignored)
3. Build app with `expo build --env .env.local`
4. Distribute to App Store/Play Store
5. Users can contribute immediately upon download

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

## Implementation Todos

- [ ] Create new Contribute tab in navigation and basic screen structure
- [ ] Add required packages: async-storage, document-picker, image-manipulator, netinfo
- [ ] Implement Zustand store for contribution state management
- [ ] Create offline queue service with AsyncStorage persistence and network detection
- [ ] Create form components following existing UI patterns with validation
- [ ] Build drawing canvas for capturing line coordinates on images using existing library
- [ ] Integrate current location capture for coordinate input
- [ ] Implement GitHub API service for branch creation, file commits, and PR creation
- [ ] Add image resizing, validation, and topo naming functionality
- [ ] Connect form submission to queue and GitHub API with error handling
- [ ] Create UI for viewing and managing offline submission queue
- [ ] Test offline/online scenarios, error handling, and end-to-end submission flow
