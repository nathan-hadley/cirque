import * as SecureStore from "expo-secure-store";
import jwt from "jsonwebtoken";

import type { FileChange, GitHubCredentials, GitHubRepoConfig, ProblemSubmission } from "@/models/contribute";

type InstallationToken = { token: string; expiresAt: number };

export class GitHubService {
	private readonly repo: GitHubRepoConfig;
	private cachedToken: InstallationToken | null = null;

	constructor(repo: GitHubRepoConfig) {
		this.repo = { apiUrl: "https://api.github.com", ...repo };
	}

	private async getStoredCredentials(): Promise<GitHubCredentials> {
		const appId = await SecureStore.getItemAsync("github_app_id");
		const installationId = await SecureStore.getItemAsync("github_installation_id");
		const privateKey = await SecureStore.getItemAsync("github_private_key");
		if (!appId || !installationId || !privateKey) {
			throw new Error("GitHub App not configured");
		}
		return { appId, installationId, privateKey };
	}

	private async getJwt(): Promise<string> {
		const { appId, privateKey } = await this.getStoredCredentials();
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iss: appId,
			iat: now - 60,
			exp: now + 9 * 60,
		};
		return jwt.sign(payload, privateKey, { algorithm: "RS256" });
	}

	private async getInstallationToken(): Promise<string> {
		const nowMs = Date.now();
		if (this.cachedToken && this.cachedToken.expiresAt - 60_000 > nowMs) {
			return this.cachedToken.token;
		}
		const { installationId } = await this.getStoredCredentials();
		const jwtToken = await this.getJwt();
		const url = `${this.repo.apiUrl}/app/installations/${installationId}/access_tokens`;
		const res = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwtToken}`,
				Accept: "application/vnd.github+json",
				"User-Agent": "Cirque-App",
			},
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to get installation token: ${res.status} ${text}`);
		}
		const data = (await res.json()) as { token: string; expires_at: string };
		this.cachedToken = { token: data.token, expiresAt: new Date(data.expires_at).getTime() };
		return data.token;
	}

	private async authHeaders(): Promise<Record<string, string>> {
		const token = await this.getInstallationToken();
		return {
			Authorization: `token ${token}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "Cirque-App",
		};
	}

	async getFileContent(path: string): Promise<{ content: string; sha: string } | null> {
		const url = `${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}/contents/${encodeURIComponent(path)}`;
		const res = await fetch(url, { headers: await this.authHeaders() });
		if (res.status === 404) return null;
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to get content: ${res.status} ${text}`);
		}
		const data = (await res.json()) as { content: string; sha: string };
		return { content: data.content, sha: data.sha };
	}

	async getDefaultBranch(): Promise<string> {
		const url = `${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}`;
		const res = await fetch(url, { headers: await this.authHeaders() });
		if (!res.ok) {
			throw new Error(`Failed to fetch repo info: ${res.status}`);
		}
		const data = (await res.json()) as { default_branch: string };
		return data.default_branch;
	}

	async getRefSha(ref: string): Promise<string> {
		const url = `${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}/git/ref/${encodeURIComponent(ref)}`;
		const res = await fetch(url, { headers: await this.authHeaders() });
		if (!res.ok) {
			throw new Error(`Failed to fetch ref ${ref}: ${res.status}`);
		}
		const data = (await res.json()) as { object: { sha: string } };
		return data.object.sha;
	}

	async createBranch(branchName: string, baseSha: string): Promise<void> {
		const url = `${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}/git/refs`;
		const res = await fetch(url, {
			method: "POST",
			headers: { ...await this.authHeaders(), "Content-Type": "application/json" },
			body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to create branch: ${res.status} ${text}`);
		}
	}

	async commitFiles(branchName: string, files: FileChange[], commitMessage: string): Promise<string> {
		// This uses the Git data API to create a tree and commit multiple files at once
		const headers = { ...await this.authHeaders(), "Content-Type": "application/json" };
		const baseRef = `heads/${branchName}`;
		const baseSha = await this.getRefSha(baseRef);

		// Create blobs for each file
		const blobShas: string[] = [];
		for (const file of files) {
			const resBlob = await fetch(`${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}/git/blobs`, {
				method: "POST",
				headers,
				body: JSON.stringify({ content: file.content, encoding: file.encoding === "base64" ? "base64" : "utf-8" }),
			});
			if (!resBlob.ok) {
				const text = await resBlob.text();
				throw new Error(`Failed to create blob: ${resBlob.status} ${text}`);
			}
			const blob = (await resBlob.json()) as { sha: string };
			blobShas.push(blob.sha);
		}

		// Create tree
		const treeEntries = files.map((file, idx) => ({ path: file.path, mode: "100644", type: "blob", sha: blobShas[idx] }));
		const resTree = await fetch(`${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}/git/trees`, {
			method: "POST",
			headers,
			body: JSON.stringify({ base_tree: baseSha, tree: treeEntries }),
		});
		if (!resTree.ok) {
			const text = await resTree.text();
			throw new Error(`Failed to create tree: ${resTree.status} ${text}`);
		}
		const tree = (await resTree.json()) as { sha: string };

		// Create commit
		const resCommit = await fetch(`${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}/git/commits`, {
			method: "POST",
			headers,
			body: JSON.stringify({ message: commitMessage, tree: tree.sha, parents: [baseSha] }),
		});
		if (!resCommit.ok) {
			const text = await resCommit.text();
			throw new Error(`Failed to create commit: ${resCommit.status} ${text}`);
		}
		const commit = (await resCommit.json()) as { sha: string };

		// Update ref
		const resUpdate = await fetch(`${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}/git/refs/heads/${encodeURIComponent(branchName)}`, {
			method: "PATCH",
			headers,
			body: JSON.stringify({ sha: commit.sha, force: false }),
		});
		if (!resUpdate.ok) {
			const text = await resUpdate.text();
			throw new Error(`Failed to update branch ref: ${resUpdate.status} ${text}`);
		}

		return commit.sha;
	}

	async createPullRequest(branchName: string, title: string, body: string): Promise<number> {
		const url = `${this.repo.apiUrl}/repos/${this.repo.owner}/${this.repo.repo}/pulls`;
		const res = await fetch(url, {
			method: "POST",
			headers: { ...await this.authHeaders(), "Content-Type": "application/json" },
			body: JSON.stringify({ title, head: branchName, base: await this.getDefaultBranch(), body }),
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to create PR: ${res.status} ${text}`);
		}
		const data = (await res.json()) as { number: number };
		return data.number;
	}

	// High-level convenience for Phase 5 integration; present here for typing
	async submitProblem(_submission: ProblemSubmission): Promise<number> {
		throw new Error("submitProblem not wired yet");
	}
}

