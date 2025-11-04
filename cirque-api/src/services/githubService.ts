import { Octokit } from "@octokit/rest";
import { type ProblemSubmission, type Env } from "../types";

const REPO_OWNER = "nathan-hadley";
const REPO_NAME = "cirque";
const BASE_BRANCH = "main";

interface GitHubPRResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  error?: string;
}

/**
 * Creates a GitHub PR with the new problem added to problems.geojson
 * and the topo image (if present) added to assets/topos and topo-image.ts
 */
export async function createProblemPR(
  submission: ProblemSubmission,
  env: Env
): Promise<GitHubPRResult> {
  try {
    const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

    // Generate branch name from problem name and timestamp
    const branchName = generateBranchName(submission.problem.name);

    // Get the latest commit SHA from main branch
    const { data: refData } = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${BASE_BRANCH}`,
    });
    const mainCommitSha = refData.object.sha;

    // Create a new branch
    await octokit.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: mainCommitSha,
    });

    // Get current problems.geojson content
    const { data: problemsFile } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: "cirque-data/problems/problems.geojson",
      ref: BASE_BRANCH,
    });

    if (!("content" in problemsFile)) {
      throw new Error("problems.geojson is not a file");
    }

    // Decode and parse the current problems.geojson
    const problemsContent = Buffer.from(problemsFile.content, "base64").toString("utf-8");
    const problemsData = JSON.parse(problemsContent);

    // Add the new problem feature
    const newFeature = buildGeoJsonFeature(submission);
    problemsData.features.push(newFeature);

    // Convert back to JSON string with proper formatting
    const updatedProblemsContent = JSON.stringify(problemsData, null, 4);

    // Commit the updated problems.geojson
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: "cirque-data/problems/problems.geojson",
      message: `Add problem: ${submission.problem.name}`,
      content: Buffer.from(updatedProblemsContent).toString("base64"),
      branch: branchName,
      sha: problemsFile.sha,
    });

    // If there's an image, add it to assets/topos and update topo-image.ts
    if (submission.problem.imageBase64 && submission.problem.topo) {
      await addTopoImage(
        octokit,
        branchName,
        submission.problem.topo,
        submission.problem.imageBase64,
        submission.problem.name
      );
    }

    // Create the pull request
    // Note: GitHub Action will automatically run sync-data when PR is created
    const { data: pr } = await octokit.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `Add problem: ${submission.problem.name}`,
      head: branchName,
      base: BASE_BRANCH,
      body: createPRBody(submission),
    });

    return {
      success: true,
      prNumber: pr.number,
      prUrl: pr.html_url,
    };
  } catch (error) {
    console.error("Error creating GitHub PR:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Adds a topo image to assets/topos and updates topo-image.ts
 */
async function addTopoImage(
  octokit: Octokit,
  branchName: string,
  topoKey: string,
  imageBase64: string,
  problemName: string
): Promise<void> {
  // Remove the data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  // Generate the filename for the topo image
  const imageFilename = `${topoKey}.jpeg`;
  const imagePath = `react-native/assets/topos/${imageFilename}`;

  // Add the image to assets/topos
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: imagePath,
    message: `Add topo image: ${imageFilename}`,
    content: base64Data,
    branch: branchName,
  });

  // Get current topo-image.ts content
  const { data: topoImageFile } = await octokit.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: "react-native/assets/topo-image.ts",
    ref: BASE_BRANCH,
  });

  if (!("content" in topoImageFile)) {
    throw new Error("topo-image.ts is not a file");
  }

  // Decode the current topo-image.ts
  const topoImageContent = Buffer.from(topoImageFile.content, "base64").toString("utf-8");

  // Add the new image entry
  // Find the closing brace of the topoImages object and insert before it
  const newEntry = `  "${topoKey}": require("@/assets/topos/${imageFilename}"),\n`;
  const updatedContent = topoImageContent.replace(
    /(\} as const;)/,
    `${newEntry}$1`
  );

  // Commit the updated topo-image.ts
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: "react-native/assets/topo-image.ts",
    message: `Update topo-image.ts for ${problemName}`,
    content: Buffer.from(updatedContent).toString("base64"),
    branch: branchName,
    sha: topoImageFile.sha,
  });
}

/**
 * Generates a branch name from the problem name
 */
function generateBranchName(problemName: string): string {
  const sanitized = problemName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const timestamp = Date.now();
  return `add-problem-${sanitized}-${timestamp}`;
}

/**
 * Builds a GeoJSON feature object matching the problems.geojson format
 */
function buildGeoJsonFeature(submission: ProblemSubmission) {
  return {
    type: "Feature",
    properties: {
      name: submission.problem.name,
      grade: submission.problem.grade,
      subarea: submission.problem.subarea,
      color: submission.problem.color ?? "",
      order: submission.problem.order?.toString() ?? "",
      topo: submission.problem.topo ?? "",
      line: JSON.stringify(submission.problem.line),
      description: submission.problem.description ?? "",
    },
    geometry: {
      type: "Point",
      coordinates: [submission.problem.lng, submission.problem.lat],
    },
  };
}

/**
 * Creates the PR body with problem details
 */
function createPRBody(submission: ProblemSubmission): string {
  return `
## New Problem Submission

**Submitted by:** ${submission.contact.name} (${submission.contact.email})

### Problem Details

- **Name:** ${submission.problem.name}
- **Grade:** ${submission.problem.grade}
- **Subarea:** ${submission.problem.subarea}
- **Color:** ${submission.problem.color || "N/A"}
- **Description:** ${submission.problem.description || "N/A"}
- **Topo:** ${submission.problem.topo || "N/A"}
- **Coordinates:** ${submission.problem.lat}, ${submission.problem.lng}
- **Line points:** ${submission.problem.line.length} points
- **Image:** ${submission.problem.imageBase64 ? "✅ Included" : "❌ Not included"}

### Changes Made

- ✅ Added problem to \`cirque-data/problems/problems.geojson\`
${submission.problem.imageBase64 && submission.problem.topo ? 
  `- ✅ Added topo image to \`react-native/assets/topos/${submission.problem.topo}.jpeg\`
- ✅ Updated \`react-native/assets/topo-image.ts\`` : ""}

### Next Steps

✅ **Automated:** A GitHub Action will automatically run \`pnpm sync-data\` and commit the updated TypeScript files to this PR.

Once the data sync is complete and all checks pass, this PR will be ready to merge!

---

*This PR was automatically generated by the Cirque API.*
`.trim();
}

