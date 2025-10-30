export const API_BASE_URL = process.env.API_BASE_URL;
export const API_KEY = process.env.API_KEY;

export const API_ENDPOINTS = {
  submitProblem: `${API_BASE_URL}/v1/problems`,
} as const;
