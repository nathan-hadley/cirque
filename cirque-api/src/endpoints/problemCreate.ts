import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, ProblemSubmissionSchema } from "../types";
import { sendProblemSubmissionEmail } from "../services/emailService";
import { featureToProblemRow } from "../problems.mjs";
import { topoKeys } from "../topos.mjs";

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
        description: "Invalid request",
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
    const { problem, contact } = submission;

    // The client-generated id is the idempotency key (primary key in D1).
    const existing = await c.env.DB.prepare("SELECT 1 FROM problems WHERE id = ?")
      .bind(submission.id)
      .first();
    if (existing) {
      console.info(`Duplicate submission: ${submission.id}`);
      return Response.json({ success: true });
    }

    // New image → store under the problem id; otherwise reference an existing topo.
    let topoSlug = problem.topo ?? null;
    if (problem.imageBase64) {
      topoSlug = submission.id;
      let bytes: Uint8Array;
      try {
        bytes = base64ToBytes(problem.imageBase64);
      } catch {
        return Response.json({ success: false, error: "Invalid image encoding" }, { status: 400 });
      }
      const keys = topoKeys(topoSlug);
      // Client uploads are already 640×480 ≤200KB JPEGs; store the same bytes as
      // both variants (content sniffing ignores the .webp name). A later
      // re-encode pass can rewrite them as real WebP thumb/full in place.
      await Promise.all([
        c.env.IMAGES.put(keys.original, bytes, { httpMetadata: { contentType: "image/jpeg" } }),
        c.env.IMAGES.put(keys.full, bytes, { httpMetadata: { contentType: "image/jpeg" } }),
        c.env.IMAGES.put(keys.thumb, bytes, { httpMetadata: { contentType: "image/jpeg" } }),
      ]);
    }

    const row = featureToProblemRow(
      {
        properties: {
          name: problem.name,
          grade: problem.grade,
          subarea: problem.subarea,
          color: problem.color,
          order: problem.order,
          description: problem.description,
          line: JSON.stringify(problem.line),
          topo: topoSlug,
        },
        geometry: { type: "Point", coordinates: [problem.lng, problem.lat] },
      },
      { id: submission.id, now: new Date().toISOString() }, // status defaults to pending
    ) as Record<string, unknown>;
    row.submitted_by_name = contact.name;
    row.submitted_by_email = contact.email;

    const cols = Object.keys(row);
    await c.env.DB.prepare(
      `INSERT INTO problems (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    )
      .bind(...cols.map((col) => row[col]))
      .run();

    const adminUrl = `${new URL(c.req.url).origin}/admin`;
    const emailResult = await sendProblemSubmissionEmail(submission, c.env, adminUrl);
    if (!emailResult.success) {
      // Row is stored; the email is just a notification.
      console.error("Failed to send notification email:", emailResult.error);
    }

    return Response.json({ success: true });
  }
}

function base64ToBytes(imageBase64: string): Uint8Array {
  const raw = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  return Uint8Array.from(atob(raw), (ch) => ch.charCodeAt(0));
}
