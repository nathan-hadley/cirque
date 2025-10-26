import { Bool, Str, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
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

    // Send email in background (non-blocking)
    c.executionCtx.waitUntil(
      sendEmail(submission, c.env).catch((error) => {
        console.error("Failed to send email:", error);
      })
    );

    // Return success response immediately
    return Response.json({ success: true });
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
    const mailerSend = new MailerSend({
      apiKey: env.MAILERSEND_API_TOKEN,
    });

    const sentFrom = new Sender("noreply@nathanhadley.com", "Cirque App");
    const recipients = [new Recipient(env.CIRQUE_EMAIL)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(`New problem submission: ${submission.problem.name}`)
      .setText(emailContent(submission))
      .setReplyTo(
        new Recipient(submission.contact.email, submission.contact.name)
      );

    await mailerSend.email.send(emailParams);

    return { success: true };
  } catch (error) {
    console.error("Error sending email via MailerSend:", error);
    return { success: false, error: "Failed to send email" };
  }
}

const emailContent = (submission: ProblemSubmission): string => {
  return `
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

Full JSON: ${JSON.stringify(submission.problem, null, 2)}
`.trim();
};
