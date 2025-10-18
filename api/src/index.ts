/**
 * Cirque API - Cloudflare Worker
 * Handles problem submissions and forwards them via MailerSend
 */

interface Env {
  MAILERSEND_API_TOKEN: string;
  MAILERSEND_FROM_EMAIL: string;
  MAILERSEND_TO_EMAIL: string;
}

interface ProblemSubmission {
  contact: {
    name: string;
    email: string;
  };
  problem: {
    name: string;
    grade: string;
    subarea: string;
    color: string;
    order: number;
    description?: string;
    lat: number;
    lng: number;
    line: number[][];
    topoFilename?: string;
    imageBase64?: string;
  };
}

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict to app domain in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Rate limiting using in-memory cache (per-worker instance)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

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
 * Simple rate limiting by IP address
 */
function checkRateLimit(request: Request): { allowed: boolean; retryAfter?: number } {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  
  // Clean up expired entries
  for (const [key, value] of rateLimitCache.entries()) {
    if (value.resetAt < now) {
      rateLimitCache.delete(key);
    }
  }
  
  const existing = rateLimitCache.get(clientIP);
  
  if (!existing || existing.resetAt < now) {
    // New window
    rateLimitCache.set(clientIP, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  existing.count++;
  return { allowed: true };
}

/**
 * Validate submission payload
 */
function validateSubmission(data: any): { valid: boolean; error?: string } {
  // Check required fields
  if (!data.contact || !data.problem) {
    return { valid: false, error: 'Missing contact or problem data' };
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
  
  // Validate problem data
  const problem = data.problem;
  if (!problem.name || typeof problem.name !== 'string') {
    return { valid: false, error: 'Invalid problem name' };
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
  if (typeof problem.order !== 'number') {
    return { valid: false, error: 'Invalid order' };
  }
  if (typeof problem.lat !== 'number' || typeof problem.lng !== 'number') {
    return { valid: false, error: 'Invalid coordinates' };
  }
  if (!Array.isArray(problem.line)) {
    return { valid: false, error: 'Invalid line data' };
  }
  
  // Validate coordinate ranges
  if (problem.lat < -90 || problem.lat > 90) {
    return { valid: false, error: 'Latitude out of range' };
  }
  if (problem.lng < -180 || problem.lng > 180) {
    return { valid: false, error: 'Longitude out of range' };
  }
  
  // Validate image size if present (10MB limit)
  if (problem.imageBase64 && typeof problem.imageBase64 === 'string') {
    const sizeInBytes = (problem.imageBase64.length * 3) / 4;
    if (sizeInBytes > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image size exceeds 10MB limit' };
    }
  }
  
  return { valid: true };
}

/**
 * Sanitize submission data for email
 */
function sanitizeSubmission(data: ProblemSubmission): ProblemSubmission {
  // Trim strings and remove potentially harmful characters
  const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, '');
  };
  
  return {
    contact: {
      name: sanitizeString(data.contact.name),
      email: sanitizeString(data.contact.email),
    },
    problem: {
      name: sanitizeString(data.problem.name),
      grade: sanitizeString(data.problem.grade),
      subarea: sanitizeString(data.problem.subarea),
      color: sanitizeString(data.problem.color),
      order: data.problem.order,
      description: data.problem.description ? sanitizeString(data.problem.description) : undefined,
      lat: data.problem.lat,
      lng: data.problem.lng,
      line: data.problem.line,
      topoFilename: data.problem.topoFilename ? sanitizeString(data.problem.topoFilename) : undefined,
      imageBase64: data.problem.imageBase64,
    },
  };
}

/**
 * Send submission via MailerSend API
 */
async function sendSubmissionEmail(
  submission: ProblemSubmission,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  try {
    // Prepare email content
    const emailBody = `
New Problem Submission

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

Full JSON:
${JSON.stringify(submission, null, 2)}
`;

    // MailerSend API request
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.MAILERSEND_API_TOKEN}`,
      },
      body: JSON.stringify({
        from: {
          email: env.MAILERSEND_FROM_EMAIL,
          name: 'Cirque Problem Submissions',
        },
        to: [
          {
            email: env.MAILERSEND_TO_EMAIL,
          },
        ],
        subject: `New Problem Submission: ${submission.problem.name}`,
        text: emailBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailerSend API error:', response.status, errorText);
      return { 
        success: false, 
        error: `Failed to send email: ${response.status}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Handle POST /v1/problem endpoint
 */
async function handleProblemSubmission(request: Request, env: Env): Promise<Response> {
  try {
    // Parse request body
    const data = await request.json() as any;
    
    // Validate submission
    const validation = validateSubmission(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      );
    }
    
    // Sanitize data
    const submission = sanitizeSubmission(data as ProblemSubmission);
    
    // Send email via MailerSend
    const result = await sendSubmissionEmail(submission, env);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to send submission' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  } catch (error) {
    console.error('Error handling problem submission:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
}

/**
 * Main worker fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    // Route: POST /v1/problem
    if (url.pathname === '/v1/problem' && request.method === 'POST') {
      // Check rate limit
      const rateLimit = checkRateLimit(request);
      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(rateLimit.retryAfter || 60),
              ...CORS_HEADERS,
            },
          }
        );
      }
      
      return handleProblemSubmission(request, env);
    }
    
    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({ status: 'ok' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      );
    }
    
    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  },
};
