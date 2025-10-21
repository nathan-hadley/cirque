/**
 * Cloudflare Worker for Cirque problem submissions
 * Accepts submissions via POST /v1/problem and forwards to MailerSend
 */

import { ProblemSubmission, ApiResponse, Env, RateLimitEntry } from './types';

// In-memory rate limiting (per-instance, resets on worker restart)
const rateLimitMap = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per hour per IP

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict to app origin in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

/**
 * Check rate limit for a given identifier (IP address)
 */
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Clean up expired entry
  if (entry && entry.resetAt < now) {
    rateLimitMap.delete(identifier);
  }

  const current = rateLimitMap.get(identifier);

  if (!current) {
    // First request from this identifier
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  current.count++;
  rateLimitMap.set(identifier, current);

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count };
}

/**
 * Validate and sanitize problem submission
 */
function validateSubmission(data: any): { valid: boolean; error?: string; submission?: ProblemSubmission } {
  // Check required fields
  if (!data.contact || !data.problem) {
    return { valid: false, error: 'Missing required fields: contact and problem' };
  }

  // Validate contact info
  if (!data.contact.name || typeof data.contact.name !== 'string') {
    return { valid: false, error: 'Invalid contact name' };
  }
  if (!data.contact.email || typeof data.contact.email !== 'string') {
    return { valid: false, error: 'Invalid contact email' };
  }
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.contact.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Validate problem fields
  const problem = data.problem;
  if (!problem.name || typeof problem.name !== 'string' || problem.name.length > 200) {
    return { valid: false, error: 'Invalid problem name (max 200 chars)' };
  }
  if (!problem.grade || typeof problem.grade !== 'string') {
    return { valid: false, error: 'Invalid grade' };
  }
  if (!problem.subarea || typeof problem.subarea !== 'string') {
    return { valid: false, error: 'Invalid subarea' };
  }
  if (!problem.color || typeof problem.color !== 'string') {
    return { valid: false, error: 'Invalid color' };
  }
  if (typeof problem.order !== 'number' || problem.order < 0) {
    return { valid: false, error: 'Invalid order (must be non-negative number)' };
  }

  // Validate coordinates
  if (typeof problem.lat !== 'number' || problem.lat < -90 || problem.lat > 90) {
    return { valid: false, error: 'Invalid latitude (must be between -90 and 90)' };
  }
  if (typeof problem.lng !== 'number' || problem.lng < -180 || problem.lng > 180) {
    return { valid: false, error: 'Invalid longitude (must be between -180 and 180)' };
  }

  // Validate line (array of [x, y] points)
  if (!Array.isArray(problem.line)) {
    return { valid: false, error: 'Invalid line (must be array of points)' };
  }
  if (problem.line.length > 1000) {
    return { valid: false, error: 'Line has too many points (max 1000)' };
  }
  for (const point of problem.line) {
    if (!Array.isArray(point) || point.length !== 2 || typeof point[0] !== 'number' || typeof point[1] !== 'number') {
      return { valid: false, error: 'Invalid line point format (must be [x, y] numbers)' };
    }
  }

  // Validate optional description
  if (problem.description !== undefined) {
    if (typeof problem.description !== 'string' || problem.description.length > 2000) {
      return { valid: false, error: 'Invalid description (max 2000 chars)' };
    }
  }

  // Validate optional imageBase64
  if (problem.imageBase64 !== undefined) {
    if (typeof problem.imageBase64 !== 'string') {
      return { valid: false, error: 'Invalid imageBase64 format' };
    }
    // Basic size check (base64 string length, roughly 10MB limit)
    if (problem.imageBase64.length > 14_000_000) {
      return { valid: false, error: 'Image too large (max ~10MB)' };
    }
  }

  // Sanitize strings (trim whitespace, basic XSS prevention)
  const sanitized: ProblemSubmission = {
    contact: {
      name: data.contact.name.trim().substring(0, 200),
      email: data.contact.email.trim().toLowerCase().substring(0, 200),
    },
    problem: {
      name: problem.name.trim().substring(0, 200),
      grade: problem.grade.trim().substring(0, 50),
      subarea: problem.subarea.trim().substring(0, 100),
      color: problem.color.trim().substring(0, 50),
      order: problem.order,
      lat: problem.lat,
      lng: problem.lng,
      line: problem.line,
      description: problem.description?.trim().substring(0, 2000),
      topoFilename: problem.topoFilename?.trim().substring(0, 200),
      imageBase64: problem.imageBase64,
    },
  };

  return { valid: true, submission: sanitized };
}

/**
 * Send submission to MailerSend
 */
async function sendToMailerSend(submission: ProblemSubmission, env: Env): Promise<{ success: boolean; error?: string }> {
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
- Description: ${submission.problem.description || 'N/A'}
- Topo Filename: ${submission.problem.topoFilename || 'N/A'}
- Line Points: ${submission.problem.line.length} points
- Has Image: ${submission.problem.imageBase64 ? 'Yes' : 'No'}

Full JSON:
${JSON.stringify(submission, null, 2)}
    `.trim();

    // Send via MailerSend API
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MAILERSEND_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: env.MAILERSEND_FROM_EMAIL,
        },
        to: [
          {
            email: env.MAILERSEND_TO_EMAIL,
          },
        ],
        subject: `New problem submission: ${submission.problem.name}`,
        text: emailContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailerSend error:', response.status, errorText);
      return { success: false, error: `MailerSend error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending to MailerSend:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Handle POST /v1/problem
 */
async function handleProblemSubmission(request: Request, env: Env): Promise<Response> {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and validate request body
    let data: any;
    try {
      data = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid JSON' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate submission
    const validation = validateSubmission(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ ok: false, error: validation.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Send to MailerSend
    const result = await sendToMailerSend(validation.submission!, env);
    if (!result.success) {
      return new Response(
        JSON.stringify({ ok: false, error: result.error || 'Failed to process submission' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Success
    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error handling problem submission:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Main worker fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new URL(request.url);

    // Route: POST /v1/problem
    if (url.pathname === '/v1/problem' && request.method === 'POST') {
      const response = await handleProblemSubmission(request, env);
      return addCorsHeaders(response);
    }

    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      return addCorsHeaders(
        new Response(JSON.stringify({ ok: true, status: 'healthy' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    // 404 for unknown routes
    return addCorsHeaders(
      new Response(JSON.stringify({ ok: false, error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  },
};
