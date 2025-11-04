import type { Context } from "hono";
import { z } from "zod";

// KVNamespace is a Cloudflare Workers type
// Stub for environments that don't have Cloudflare Workers types
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface KVNamespace {}
}

export interface Env {
  MAILERSEND_API_TOKEN: string;
  CIRQUE_EMAIL: string;
  API_KEY: string;
  GITHUB_TOKEN: string;
  RATE_LIMIT_KV: KVNamespace;
}

export type AppContext = Context<{ Bindings: Env }>;

// Validation constants
export const VALIDATION_CONSTRAINTS = {
  MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 300,
  LINE_MAX_POINTS: 10,
  LAT_MIN: -90,
  LAT_MAX: 90,
  LNG_MIN: -180,
  LNG_MAX: 180,
} as const;

export const ProblemSubmissionSchema = z.object({
  id: z.string().describe("1699123456789-abc123def456"),
  contact: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(VALIDATION_CONSTRAINTS.MIN_LENGTH, "Name is required")
      .max(
        VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH,
        `Name must be ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters or less`
      )
      .describe("John Doe"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .describe("john.doe@example.com"),
  }),
  problem: z.object({
    name: z
      .string({ required_error: "Problem name is required" })
      .min(VALIDATION_CONSTRAINTS.MIN_LENGTH, "Problem name is required")
      .max(
        VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH,
        `Problem name must be ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters or less`
      )
      .describe("The Physical"),
    grade: z
      .string({ required_error: "Grade is required" })
      .min(1, "Grade is required")
      .describe("V4"),
    subarea: z
      .string({ required_error: "Subarea is required" })
      .min(1, "Subarea is required")
      .describe("Forestland"),
    color: z.string().optional().describe("black"),
    order: z.number().optional().describe("1"),
    description: z
      .string()
      .min(VALIDATION_CONSTRAINTS.MIN_LENGTH, "Description is required")
      .max(
        VALIDATION_CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
        `Description must be ${VALIDATION_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters or less`
      )
      .describe("Reach high off the slab and pull into compression."),
    lat: z
      .number({ required_error: "Latitude is required" })
      .min(
        VALIDATION_CONSTRAINTS.LAT_MIN,
        `Latitude must be between ${VALIDATION_CONSTRAINTS.LAT_MIN} and ${VALIDATION_CONSTRAINTS.LAT_MAX}`
      )
      .max(
        VALIDATION_CONSTRAINTS.LAT_MAX,
        `Latitude must be between ${VALIDATION_CONSTRAINTS.LAT_MIN} and ${VALIDATION_CONSTRAINTS.LAT_MAX}`
      )
      .describe("47.54520973656"),
    lng: z
      .number({ required_error: "Longitude is required" })
      .min(
        VALIDATION_CONSTRAINTS.LNG_MIN,
        `Longitude must be between ${VALIDATION_CONSTRAINTS.LNG_MIN} and ${VALIDATION_CONSTRAINTS.LNG_MAX}`
      )
      .max(
        VALIDATION_CONSTRAINTS.LNG_MAX,
        `Longitude must be between ${VALIDATION_CONSTRAINTS.LNG_MIN} and ${VALIDATION_CONSTRAINTS.LNG_MAX}`
      )
      .describe("-120.73245630919"),
    line: z
      .array(z.tuple([z.number(), z.number()]))
      .max(
        VALIDATION_CONSTRAINTS.LINE_MAX_POINTS,
        `Line must have ${VALIDATION_CONSTRAINTS.LINE_MAX_POINTS} points or fewer`
      )
      .describe("Array of [x, y] pixel coordinate pairs"),
    topo: z.string().optional().describe("forestland-physical"),
    imageBase64: z.string().optional().describe("Base64 encoded image"),
  }),
});

export type ProblemSubmission = z.infer<typeof ProblemSubmissionSchema>;
