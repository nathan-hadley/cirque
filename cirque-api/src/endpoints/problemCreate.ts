import { Bool, Str, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {
  type AppContext,
  ProblemSubmissionSchema,
  type ProblemSubmission,
  Env,
} from "../types";

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
        description: "Invalid request body",
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

    return { success: true };
  }
}

function errorResponse(error: string) {
  return Response.json({ success: false, error: error }, { status: 400 });
}

async function sendEmail(
  submission: ProblemSubmission,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  try {
    // Format email content
    const emailContent = `
      New Problem Submission
      =====================

      Contact Information:
      - Name: ${submission.contact.name}
      - Email: ${submission.contact.email}

      Problem Details:
      - Name: ${submission.problem.name}
      - Grade: ${submission.problem.grade}
      - Subarea: ${submission.problem.subarea}
      - Color: ${submission.problem.color}
      - Order: ${submission.problem.order}
      - Coordinates: ${submission.problem.lat}, ${submission.problem.lng}
      - Description: ${submission.problem.description || "N/A"}
      - Topo filename: ${submission.problem.topoFilename || "N/A"}
      - Line points: ${submission.problem.line.length} points
      - Has image: ${submission.problem.imageBase64 ? "Yes" : "No"}

      Full JSON: ${JSON.stringify(submission, null, 2)}
    `.trim();

    // Send via MailerSend API
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MAILERSEND_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { email: env.CIRQUE_EMAIL },
        to: [{ email: env.CIRQUE_EMAIL }],
        subject: `New problem submission: ${submission.problem.name}`,
        text: emailContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MailerSend error:", response.status, errorText);
      return { success: false, error: `MailerSend error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending to MailerSend:", error);
    return { success: false, error: "Failed to send email" };
  }
}
