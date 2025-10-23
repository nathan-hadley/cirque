import type { ProblemSubmission } from "@cirque-api/types";
import { API_ENDPOINTS } from "@/constants/api";

export type SubmitProblemResponse = {
  success: boolean;
  error?: string;
};

export async function submitProblem(submission: ProblemSubmission): Promise<SubmitProblemResponse> {
  const response = await fetch(API_ENDPOINTS.submitProblem, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
