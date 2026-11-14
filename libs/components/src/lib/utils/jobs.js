/** Error of a job that failed, or of a start request that queued no job. */
export class JobError extends Error {
  constructor(message, body = null) {
    super(message);
    this.name = 'JobError';
    this.body = body;
  }
}

const DEADLINE_MS = 15 * 60 * 1000;

const wait = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(signal.reason);
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
});

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const routeMissing = (response, body) => (response.status === 404 || response.status === 405) && !(body && 'Success' in body);

/** Starts a job with a POST to startUrl, polls jobsUrl/<id> until it ends or deadlineMs passes, and returns its JSON result. A server with no job route gets a POST to fallbackUrl. */
export async function runJob(startUrl, jobsUrl, options = {}, { signal, intervalMs = 1000, fallbackUrl, deadlineMs = DEADLINE_MS } = {}) {
  const headers = options.headers || {};
  const started = await fetch(startUrl, { ...options, method: 'POST', signal });
  const startBody = await readJson(started);
  if (fallbackUrl && routeMissing(started, startBody)) {
    const direct = await fetch(fallbackUrl, { ...options, method: 'POST', signal });
    const directBody = await readJson(direct);
    if (!direct.ok) throw new JobError(directBody?.Message || `Request failed (${direct.status})`, directBody);
    return directBody;
  }
  if (started.status !== 202 || !startBody?.job_id) {
    throw new JobError(startBody?.Message || `Job start failed (${started.status})`, startBody);
  }
  const statusUrl = `${jobsUrl}/${startBody.job_id}`;
  const deadline = Date.now() + deadlineMs;
  for (;;) {
    await wait(intervalMs, signal);
    const polled = await fetch(statusUrl, { headers, signal });
    const job = await readJson(polled);
    if (!polled.ok || !job) throw new JobError(`Job status failed (${polled.status})`, job);
    if (job.status === 'failed') throw new JobError(job.error || 'Job failed', job);
    if (job.status === 'done') break;
    if (Date.now() >= deadline) throw new JobError(`Job did not end in ${Math.round(deadlineMs / 1000)} s (${job.status})`, job);
  }
  const answer = await fetch(`${statusUrl}/result`, { headers, signal });
  const body = await readJson(answer);
  if (!answer.ok || !body) throw new JobError(`Job result failed (${answer.status})`, body);
  return body.result;
}
