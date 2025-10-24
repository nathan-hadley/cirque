export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export const API_ENDPOINTS = {
  submitProblem: `${API_BASE_URL}/v1/problems`,
} as const;
