/**
 * Type definitions for problem submissions
 */

export interface ProblemSubmission {
  contact: {
    name: string;
    email: string;
  };
  problem: {
    name: string;
    grade: string;
    subarea: string;
    color: string;
    order: number;
    description?: string;
    lat: number;
    lng: number;
    line: number[][]; // normalized points [x, y]
    topoFilename?: string;
    imageBase64?: string; // base64 encoded image if new
  };
}

export interface ApiResponse {
  ok: boolean;
  error?: string;
}

export interface Env {
  MAILERSEND_API_TOKEN: string;
  MAILERSEND_FROM_EMAIL: string;
  MAILERSEND_TO_EMAIL: string;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}
