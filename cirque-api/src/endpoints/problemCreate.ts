import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, ProblemSubmissionSchema } from "../types";
import { sendProblemSubmissionEmail } from "../services/emailService";

export class SubmitProblem extends OpenAPIRoute {
  schema = {
    tags: ["Problems"],
    summary: "Submit a new problem",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ProblemSubmissionSchema,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Problem submitted successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().describe("true"),
            }),
          },
        },
      },
      "400": {
        description: "Invalid request or email sending failed",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().describe("false"),
              error: z.string().describe("Error message"),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const submission = data.body;

    const idempotencyKey = submission.id || c.req.header("Idempotency-Key");

    if (idempotencyKey) {
      const kvKey = `idempotency:${idempotencyKey}`;
      const existingSubmission = await c.env.RATE_LIMIT_KV.get(kvKey);

      if (existingSubmission) {
        console.info(`Duplicate submission detected with idempotency key: ${idempotencyKey}`);
        return Response.json({ success: true });
      }
    }

    console.info({ submission, idempotencyKey });

    const emailResult = await sendProblemSubmissionEmail(submission, c.env);

    if (!emailResult.success) {
      return errorResponse(
        emailResult.error || "Failed to send submission email"
      );
    }

    if (idempotencyKey) {
      const kvKey = `idempotency:${idempotencyKey}`;
      await c.env.RATE_LIMIT_KV.put(
        kvKey,
        JSON.stringify({ 
          timestamp: Date.now(),
          problemName: submission.problem.name 
        }),
        { expirationTtl: 604800 }
      );
    }

    return Response.json({ success: true });
  }
}

function errorResponse(error: string) {
  return Response.json({ success: false, error: error }, { status: 400 });
}
