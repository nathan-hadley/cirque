import {
  MailerSend,
  EmailParams,
  Sender,
  Recipient,
  Attachment,
} from "mailersend";
import { type ProblemSubmission, type Env } from "../types";

/**
 * Sends a problem submission email with the problem details and optional image attachment
 */
export async function sendProblemSubmissionEmail(
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
      .setText(formatEmailContent(submission))
      .setReplyTo(
        new Recipient(submission.contact.email, submission.contact.name)
      );

    // Attach image if present
    if (submission.problem.imageBase64) {
      const attachment = createImageAttachment(submission);
      if (attachment) {
        emailParams.setAttachments([attachment]);
      }
    }

    await mailerSend.email.send(emailParams);

    return { success: true };
  } catch (error) {
    console.error("Error sending email via MailerSend:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Creates an image attachment from base64 data
 */
function createImageAttachment(
  submission: ProblemSubmission
): Attachment | null {
  try {
    if (!submission.problem.imageBase64) {
      return null;
    }

    // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = submission.problem.imageBase64.replace(
      /^data:image\/\w+;base64,/,
      ""
    );

    const filename = `${submission.problem.name
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}.jpeg`;

    const attachment = new Attachment(base64Data, filename);
    attachment.disposition = "attachment";

    return attachment;
  } catch (error) {
    console.error("Failed to create image attachment:", error);
    return null;
  }
}

/**
 * Formats the email content with problem details and GeoJSON feature
 */
function formatEmailContent(submission: ProblemSubmission): string {
  const geoJsonFeature = buildGeoJsonFeature(submission);

  return `
New Problem Submission
=====================

Submission ID: ${submission.clientSubmissionId}

Contact Information:
- Name: ${submission.contact.name}
- Email: ${submission.contact.email}

Problem Details:
- Name: ${submission.problem.name}
- Grade: ${submission.problem.grade}
- Subarea: ${submission.problem.subarea}
- Color: ${submission.problem.color || "N/A"}
- Coordinates: ${submission.problem.lat}, ${submission.problem.lng}
- Description: ${submission.problem.description || "N/A"}
- Topo: ${submission.problem.topo || "N/A"}
- Line points: ${submission.problem.line.length} points
- Image attached: ${
    submission.problem.imageBase64 ? "Yes (see attachment)" : "No"
  }

Full GeoJSON Feature:
${JSON.stringify(geoJsonFeature, null, 2)}
`.trim();
}

/**
 * Builds a GeoJSON feature object matching the problems.geojson format
 */
function buildGeoJsonFeature(submission: ProblemSubmission) {
  return {
    type: "Feature",
    properties: {
      name: submission.problem.name,
      grade: submission.problem.grade,
      subarea: submission.problem.subarea,
      color: submission.problem.color ?? "",
      topo: submission.problem.topo,
      line: JSON.stringify(submission.problem.line),
      description: submission.problem.description ?? "",
    },
    geometry: {
      type: "Point",
      coordinates: [submission.problem.lng, submission.problem.lat],
    },
  };
}
