export type ContributionColor = "black" | "blue" | "red" | "white";

export type ProblemSubmission = {
	// Contact information for PR description only
	submitterName: string;
	submitterEmail: string;

	// Problem details
	problemName: string;
	grade: string; // e.g., "V2", "V5", "Low 5th"
	subarea: string;
	color: ContributionColor;
	order: number;
	description?: string;

	// Location
	latitude: number;
	longitude: number;

	// Topo line coordinates sampled along drawn path
	coordinates: number[][]; // [[x, y], ...] in image coordinate space

	// Image handling
	newImage?: boolean;
	imageBase64?: string; // JPEG base64 without data URI prefix
	topoFilename?: string; // precomputed filename if any
};

export type SubmissionResult = {
	success?: boolean;
	queued?: boolean;
	prNumber?: number;
	message?: string;
};

export type QueueItemStatus = "pending" | "processing" | "failed" | "done";

export type QueueItem = {
	id: string;
	data: ProblemSubmission;
	attempts: number;
	status: QueueItemStatus;
	lastError?: string;
	createdAt: number;
	updatedAt: number;
};

export type FileChange = {
	path: string;
	content: string; // base64-encoded for binary, utf-8 string otherwise
	encoding: "base64" | "utf-8";
};

export type GitHubCredentials = {
	appId: string;
	installationId: string;
	privateKey: string; // PEM format
};

export type GitHubRepoConfig = {
	owner: string;
	repo: string;
	apiUrl?: string; // defaults to https://api.github.com
};

