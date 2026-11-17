import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { getBundle, processJob, type RenderJob } from "./render";

/*
 * Render worker (deploy on Railway). The Next.js app POSTs a job to /render,
 * the worker answers 202 right away, then: TTS per scene → Remotion render →
 * upload MP4 to Supabase Storage → POST progress/result to job.callbackUrl.
 * Jobs run one at a time; extra jobs wait in memory.
 */

const SECRET = process.env.RENDER_WORKER_SECRET ?? "";
const PORT = Number(process.env.PORT ?? 8080);

if (!SECRET) {
  console.error("RENDER_WORKER_SECRET is required");
  process.exit(1);
}

const queue: RenderJob[] = [];
let running = false;

function authorized(header: string | undefined) {
  const want = Buffer.from(`Bearer ${SECRET}`);
  const got = Buffer.from(header ?? "");
  return got.length === want.length && timingSafeEqual(got, want);
}

async function drain() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    const started = Date.now();
    console.log(`[job ${job.jobId}] start (${job.scenes.length} scenes)`);
    await processJob(job, async (body) => {
      try {
        await fetch(job.callbackUrl, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
          body: JSON.stringify({ jobId: job.jobId, ...body }),
        });
      } catch (e) {
        console.error(`[job ${job.jobId}] callback failed`, e);
      }
      console.log(`[job ${job.jobId}]`, body.status, body.stage ?? body.error ?? "");
    });
    console.log(`[job ${job.jobId}] finished in ${Math.round((Date.now() - started) / 1000)}s`);
  }
  running = false;
}

createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, queued: queue.length, running }));
  }
  if (req.method !== "POST" || req.url !== "/render") {
    res.writeHead(404);
    return res.end();
  }
  if (!authorized(req.headers.authorization)) {
    res.writeHead(401);
    return res.end("unauthorized");
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    const job = JSON.parse(raw) as RenderJob;
    if (!job.jobId || !Array.isArray(job.scenes) || !job.callbackUrl) throw new Error("invalid job");
    queue.push(job);
    res.writeHead(202, { "content-type": "application/json" });
    res.end(JSON.stringify({ accepted: job.jobId, position: queue.length }));
    void drain();
  } catch (e) {
    res.writeHead(400);
    res.end(String(e));
  }
}).listen(PORT, () => {
  console.log(`render worker on :${PORT}`);
  // Warm the webpack bundle so the first job starts faster.
  getBundle().then(() => console.log("bundle ready")).catch((e: unknown) => console.error("bundle failed", e));
});
