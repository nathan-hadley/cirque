import { Bool, Str, OpenAPIRoute } from "chanfana";
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
              series: z.object({
                success: Bool(),
              }),
            }),
          },
        },
      },
      "400": {
        description: "Invalid request or email sending failed",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                error: Str(),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    // Get validated data
    const data = await this.getValidatedData<typeof this.schema>();

    const submission = data.body;
    const contact = submission.contact;
    const problem = submission.problem;

    console.info({ submission });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      return errorResponse("Invalid email format");
    }

    if (problem.name.length > 100) {
      return errorResponse("Invalid problem name (max 100 chars)");
    }
    if (problem.line.length > 10) {
      return errorResponse("Line has too many points (max 10)");
    }
    for (const point of problem.line) {
      if (point.length !== 2) {
        return errorResponse(
          "Invalid line point format (must be [x, y] numbers)"
        );
      }
    }
    if (problem.description !== undefined) {
      if (problem.description.length > 300) {
        return errorResponse("Invalid description (max 300 chars)");
      }
    }

    // Send email and wait for result
    const emailResult = await sendProblemSubmissionEmail(submission, c.env);

    if (!emailResult.success) {
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
