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

    const dedupeKey = `submission:${submission.clientSubmissionId}`;

    const alreadyProcessed = await c.env.RATE_LIMIT_KV.get(dedupeKey);
    if (alreadyProcessed) {
      console.info({
        event: "duplicate_submission",
        clientSubmissionId: submission.clientSubmissionId,
      });
      return Response.json({ success: true });
    }

    console.info({ submission });

    // Send email and wait for result
    const emailResult = await sendProblemSubmissionEmail(submission, c.env);

    if (!emailResult.success) {
      return errorResponse(
        emailResult.error || "Failed to send submission email"
      );
    }

    await c.env.RATE_LIMIT_KV.put(dedupeKey, "processed", {
      expirationTtl: 60 * 60 * 24 * 7, // 7 days
    });

    // Return success only if email was sent
    return Response.json({ success: true });
  }
}

function errorResponse(error: string) {
  return Response.json({ success: false, error: error }, { status: 400 });
}
