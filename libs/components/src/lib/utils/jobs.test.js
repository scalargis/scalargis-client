import { afterEach, describe, expect, it, vi } from 'vitest';
import { runJob, JobError } from './jobs';

const reply = (status, body) => Promise.resolve({ status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body) });

afterEach(() => { vi.unstubAllGlobals(); });

describe('runJob', () => {
  it('starts the job, polls until done and returns the result', async () => {
    const calls = [];
    const answers = [
      reply(202, { job_id: 'j1' }),
      reply(200, { status: 'queued' }),
      reply(200, { status: 'running' }),
      reply(200, { status: 'done' }),
      reply(200, { id: 'j1', result: { Success: true, Data: { url: '/f.pdf' } } }),
    ];
    vi.stubGlobal('fetch', vi.fn((url, init) => { calls.push([url, init?.method || 'GET', init?.headers]); return answers.shift(); }));

    const result = await runJob('/api/x/job', '/api/jobs', { headers: { 'X-API-KEY': 'k' }, body: 'a=1' }, { intervalMs: 1 });

    expect(result).toEqual({ Success: true, Data: { url: '/f.pdf' } });
    expect(calls.map(c => c.slice(0, 2))).toEqual([
      ['/api/x/job', 'POST'], ['/api/jobs/j1', 'GET'], ['/api/jobs/j1', 'GET'], ['/api/jobs/j1', 'GET'], ['/api/jobs/j1/result', 'GET'],
    ]);
    expect(calls[1][2]).toEqual({ 'X-API-KEY': 'k' });
  });

  it('throws the job error of a failed job', async () => {
    const answers = [reply(202, { job_id: 'j2' }), reply(200, { status: 'failed', error: 'boom' })];
    vi.stubGlobal('fetch', vi.fn(() => answers.shift()));
    await expect(runJob('/s', '/api/jobs', {}, { intervalMs: 1 })).rejects.toThrow('boom');
  });

  it('throws when the start queues no job', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reply(404, { Success: false, Message: 'not configured' })));
    const error = await runJob('/s', '/api/jobs', {}, { intervalMs: 1 }).catch(e => e);
    expect(error).toBeInstanceOf(JobError);
    expect(error.message).toBe('not configured');
  });

  it('posts to the fallback url when the server has no job route', async () => {
    const calls = [];
    const answers = [reply(404, { message: 'not found' }), reply(200, { Success: true, Data: { url: '/g.pdf' } })];
    vi.stubGlobal('fetch', vi.fn((url) => { calls.push(url); return answers.shift(); }));
    const result = await runJob('/gen/job', '/api/jobs', { body: 'a=1' }, { intervalMs: 1, fallbackUrl: '/gen' });
    expect(result).toEqual({ Success: true, Data: { url: '/g.pdf' } });
    expect(calls).toEqual(['/gen/job', '/gen']);
  });

  it('keeps a 404 answer of the job route as an error', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reply(404, { Success: false, Message: 'not configured' })));
    await expect(runJob('/gen/job', '/api/jobs', {}, { intervalMs: 1, fallbackUrl: '/gen' })).rejects.toThrow('not configured');
  });

  it('stops polling on abort', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(() => reply(202, { job_id: 'j3' })));
    const running = runJob('/s', '/api/jobs', {}, { signal: controller.signal, intervalMs: 50 });
    controller.abort(new Error('aborted'));
    await expect(running).rejects.toThrow('aborted');
  });
});
