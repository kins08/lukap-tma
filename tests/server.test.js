'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawn } = require('child_process');

const port = 42991;
const root = path.resolve(__dirname, '..');

test('server headers, health and static whitelist', async (t) => {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', LUKAP_SERVE_SOURCE: '1' },
    stdio: 'ignore'
  });
  t.after(() => child.kill());

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${base}/healthz`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, 'server did not start');

  const home = await fetch(`${base}/`);
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert.match(homeHtml, /<meta name="lukap-log" content="\/log">/);
  assert.match(home.headers.get('content-security-policy') || '', /frame-ancestors/);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('cache-control'), 'no-cache');

  const script = await fetch(`${base}/app.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get('cache-control') || '', /immutable/);

  assert.equal((await fetch(`${base}/server.js`)).status, 404);
  assert.equal((await fetch(`${base}/_headers`)).status, 404);
  assert.equal((await fetch(`${base}/..%2Fserver.js`)).status, 400);
  assert.equal((await fetch(`${base}/healthz`, { method: 'POST' })).status, 405);

  const log = (body) => fetch(`${base}/log`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  assert.equal((await log({ kind: 'error', message: 'test error' })).status, 202);
  assert.equal((await log({ kind: 'error', message: '' })).status, 400);
  assert.equal((await log('not json')).status, 400);
  assert.equal((await log({ kind: 'error', message: 'x'.repeat(5000) })).status, 413);
  assert.equal((await fetch(`${base}/log`)).status, 405);

  let limited = 0;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    if ((await log({ kind: 'error', message: `burst ${attempt}` })).status === 429) limited += 1;
  }
  assert.ok(limited > 0, 'client log endpoint must rate limit');
});
