import { Str, Num } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export interface Env {
  MAILERSEND_API_TOKEN: string;
  CIRQUE_EMAIL: string;
  API_KEY: string;
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
  contact: z.object({
    name: Str({ example: "John Doe" })
      .min(VALIDATION_CONSTRAINTS.MIN_LENGTH, "Name is required")
      .max(
        VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH,
        `Name must be ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters or less`
      ),
    email: Str({ example: "john.doe@example.com" }).email(
      "Invalid email format"
    ),
  }),
  problem: z.object({
    name: Str({ example: "The Physical" })
      .min(VALIDATION_CONSTRAINTS.MIN_LENGTH, "Problem name is required")
      .max(
        VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH,
        `Problem name must be ${VALIDATION_CONSTRAINTS.NAME_MAX_LENGTH} characters or less`
      ),
    grade: Str({ example: "V4" }).min(1, "Grade is required"),
    subarea: Str({ example: "Forestland" }).min(1, "Subarea is required"),
    color: Str({ required: false, example: "black" }),
    order: Num({ required: false, example: 1 }),
    description: Str({
      example: "Reach high off the slab and pull into compression.",
    })
      .min(VALIDATION_CONSTRAINTS.MIN_LENGTH, "Description is required")
      .max(
        VALIDATION_CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
        `Description must be ${VALIDATION_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters or less`
      ),
    lat: Num({ example: 47.54520973656 })
      .min(
        VALIDATION_CONSTRAINTS.LAT_MIN,
        `Latitude must be between ${VALIDATION_CONSTRAINTS.LAT_MIN} and ${VALIDATION_CONSTRAINTS.LAT_MAX}`
      )
      .max(
        VALIDATION_CONSTRAINTS.LAT_MAX,
        `Latitude must be between ${VALIDATION_CONSTRAINTS.LAT_MIN} and ${VALIDATION_CONSTRAINTS.LAT_MAX}`
      ),
    lng: Num({ example: -120.73245630919 })
      .min(
        VALIDATION_CONSTRAINTS.LNG_MIN,
        `Longitude must be between ${VALIDATION_CONSTRAINTS.LNG_MIN} and ${VALIDATION_CONSTRAINTS.LNG_MAX}`
      )
      .max(
        VALIDATION_CONSTRAINTS.LNG_MAX,
        `Longitude must be between ${VALIDATION_CONSTRAINTS.LNG_MIN} and ${VALIDATION_CONSTRAINTS.LNG_MAX}`
      ),
    line: z
      .array(z.tuple([z.number(), z.number()]))
      .max(
        VALIDATION_CONSTRAINTS.LINE_MAX_POINTS,
        `Line must have ${VALIDATION_CONSTRAINTS.LINE_MAX_POINTS} points or fewer`
      ),
    topo: Str({ required: false, example: "forestland-physical" }),
    imageBase64: Str({ required: false }),
  }),
});

export type ProblemSubmission = z.infer<typeof ProblemSubmissionSchema>;
