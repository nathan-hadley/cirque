import { fromHono } from "chanfana";
import { Hono } from "hono";
import { SubmitProblem } from "./endpoints/problemCreate";
import { getData, getImage, getImagesManifest } from "./endpoints/data";
import {
  getDocument,
  listProblems,
  putDocument,
  reviewProblem,
  updateProblem,
} from "./endpoints/admin";
import { ADMIN_HTML } from "./admin/page";
import { backupKeysToPrune, buildBackup } from "./backup.mjs";
import {
  accessMiddleware,
  authMiddleware,
  rateLimitMiddleware,
  readRateLimitMiddleware,
} from "./middleware";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Public images (no API key: loaded directly by <img>/expo-image)
app.get("/images/*", getImage);

// Admin (Cloudflare Access; no API key)
app.use("/admin", accessMiddleware);
app.use("/v1/admin/*", accessMiddleware);
app.get("/admin", (c) => c.html(ADMIN_HTML));
app.get("/v1/admin/problems", listProblems);
app.put("/v1/admin/problems/:id", updateProblem);
app.post("/v1/admin/problems/:id/approve", reviewProblem("approved"));
app.post("/v1/admin/problems/:id/reject", reviewProblem("rejected"));
app.get("/v1/admin/documents/:name", getDocument);
app.put("/v1/admin/documents/:name", putDocument);

// Public API (API key + rate limits: 50/day writes, 1000/day reads)
app.use("/v1/data", authMiddleware, readRateLimitMiddleware);
app.use("/v1/images/manifest", authMiddleware, readRateLimitMiddleware);
app.use("/v1/problems", authMiddleware, rateLimitMiddleware);
app.get("/v1/data", getData);
app.get("/v1/images/manifest", getImagesManifest);

// Register OpenAPI endpoints
openapi.post("/v1/problems", SubmitProblem);

async function scheduled(_controller: ScheduledController, env: Env): Promise<void> {
  const [problems, documents] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM problems"),
    env.DB.prepare("SELECT * FROM documents"),
  ]);
  const now = new Date();
  const { key, body } = buildBackup(problems.results, documents.results, now);
  await env.IMAGES.put(key, body, { httpMetadata: { contentType: "application/json" } });

  const existing = await env.IMAGES.list({ prefix: "backups/" });
  const prune = backupKeysToPrune(existing.objects.map((o) => o.key), now);
  if (prune.length) await env.IMAGES.delete(prune);
  console.info({ event: "backup_complete", key, problems: problems.results.length, pruned: prune.length });
}

export default { fetch: app.fetch, scheduled };
