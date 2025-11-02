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
    // Get validated data (validation handled by Zod schema)
    const data = await this.getValidatedData<typeof this.schema>();

    const submission = data.body;

    // Check for idempotency key in headers
    const idempotencyKey = c.req.header("Idempotency-Key");
    
    if (idempotencyKey) {
      // Check if we've already processed this idempotency key
      const idempotencyKeyPrefix = `idempotency:${idempotencyKey}`;
      const existing = await c.env.RATE_LIMIT_KV.get(idempotencyKeyPrefix);
      
      if (existing) {
        // This is a duplicate request - return success without processing
        console.info(`Duplicate submission detected for idempotency key: ${idempotencyKey}`);
        return Response.json({ success: true });
      }
      
      // Store idempotency key IMMEDIATELY to prevent race conditions
      // We'll delete it if processing fails, but keep it if successful
      // Use a timestamp value to track when it was processed
      await c.env.RATE_LIMIT_KV.put(idempotencyKeyPrefix, Date.now().toString(), {
        expirationTtl: 86400, // 24 hours
      });
    }

    console.info({ submission, idempotencyKey });

    // Send email and wait for result
    const emailResult = await sendProblemSubmissionEmail(submission, c.env);

    if (!emailResult.success) {
      // If email failed, remove the idempotency key so it can be retried
      if (idempotencyKey) {
        await c.env.RATE_LIMIT_KV.delete(`idempotency:${idempotencyKey}`);
      }
      return errorResponse(
        emailResult.error || "Failed to send submission email"
      );
    }

    // Return success only if email was sent
    return Response.json({ success: true });
  }
}

function errorResponse(error: string) {
  return Response.json({ success: false, error: error }, { status: 400 });
}
