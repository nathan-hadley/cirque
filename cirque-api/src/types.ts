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
    color: Str({ required: false, example: "black" }).optional(),
    order: Num({ required: false, example: 1 }).optional(),
    description: Str({
      required: false,
      example: "Reach high off the slab and pull into compression.",
    }).optional(),
    lat: Num({ example: 47.54520973656 }),
    lng: Num({ example: -120.73245630919 }),
    line: z.array(z.tuple([z.number(), z.number()])).max(10),
    topo: Str({ required: false, example: "forestland-physical" }).optional(),
    imageBase64: Str({ required: false }).optional(),
  }),
});

export type ProblemSubmission = z.infer<typeof ProblemSubmissionSchema>;
