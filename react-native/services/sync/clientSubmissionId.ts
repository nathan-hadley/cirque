export function generateClientSubmissionId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (error) {
    console.warn("Failed to use crypto.randomUUID, falling back to timestamp-based ID", error);
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function ensureClientSubmissionId<T extends { clientSubmissionId?: string }>(
  submission: T
): T & { clientSubmissionId: string } {
  if (submission.clientSubmissionId && submission.clientSubmissionId.length > 0) {
    return submission as T & { clientSubmissionId: string };
  }

  const clientSubmissionId = generateClientSubmissionId();
  return { ...submission, clientSubmissionId };
}
