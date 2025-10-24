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

export const ProblemSubmissionSchema = z.object({
  contact: z.object({
    name: Str({ example: "John Doe" }),
    email: Str({ example: "john.doe@example.com" }),
  }),
  problem: z.object({
    name: Str({ example: "The Physical" }),
    grade: Str({ example: "V4" }),
    subarea: Str({ example: "Forestland" }),
    color: Str({ required: false, example: "black" }),
    order: Num({ required: false, example: 1 }),
    description: Str({
      required: false,
      example: "Reach high off the slab and pull into compression.",
    }),
    lat: Num({ example: 47.54520973656 }),
    lng: Num({ example: -120.73245630919 }),
    line: z.array(z.array(Num(), Num())),
    topoFilename: Str({ required: false }),
    imageBase64: Str({ required: false }),
  }),
});

export type ProblemSubmission = z.infer<typeof ProblemSubmissionSchema>;
