'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const { CSP_HEADER } = require('./config/csp');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4173;
const DIST = path.join(ROOT, 'dist');
const BASE_DIR = process.env.LUKAP_SERVE_SOURCE === '1'
  ? ROOT
  : fs.existsSync(path.join(DIST, 'index.html')) ? DIST : ROOT;
const PUBLIC_FILES = new Map([
  ['/index.html', { file: 'index.html', type: 'text/html; charset=utf-8', cache: 'no-cache' }],
  ['/app.js', { file: 'app.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/avatar3d.js', { file: 'avatar3d.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/item-art.js', { file: 'item-art.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/lib/security.js', { file: 'lib/security.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/lib/outfit.js', { file: 'lib/outfit.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/lib/state.js', { file: 'lib/state.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/data/leaderboard-mock.js', { file: 'data/leaderboard-mock.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/app.css', { file: 'app.css', type: 'text/css; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/fonts/cormorant-garamond-cyrillic.woff2', { file: 'fonts/cormorant-garamond-cyrillic.woff2', type: 'font/woff2', cache: 'public, max-age=31536000, immutable' }],
  ['/fonts/cormorant-garamond-latin.woff2', { file: 'fonts/cormorant-garamond-latin.woff2', type: 'font/woff2', cache: 'public, max-age=31536000, immutable' }],
  ['/fonts/manrope-cyrillic.woff2', { file: 'fonts/manrope-cyrillic.woff2', type: 'font/woff2', cache: 'public, max-age=31536000, immutable' }],
  ['/fonts/manrope-latin.woff2', { file: 'fonts/manrope-latin.woff2', type: 'font/woff2', cache: 'public, max-age=31536000, immutable' }],
  ['/fonts/unbounded-cyrillic.woff2', { file: 'fonts/unbounded-cyrillic.woff2', type: 'font/woff2', cache: 'public, max-age=31536000, immutable' }],
  ['/fonts/unbounded-latin.woff2', { file: 'fonts/unbounded-latin.woff2', type: 'font/woff2', cache: 'public, max-age=31536000, immutable' }],
  ['/vendor/three.min.js', { file: 'vendor/three.min.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/robots.txt', { file: 'robots.txt', type: 'text/plain; charset=utf-8', cache: 'public, max-age=86400' }]
]);

function setSecurityHeaders(res, isHttps) {
  res.setHeader('Content-Security-Policy', CSP_HEADER);
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (isHttps) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

const LOG_MAX_BYTES = 4096;
const LOG_WINDOW_MS = 60000;
const LOG_MAX_REQUESTS = 20;
const LOG_META = '<meta name="lukap-log" content="">';
const logHits = new Map();

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

function allowLog(ip) {
  const now = Date.now();
  const entry = logHits.get(ip);
  if (!entry || now - entry.start > LOG_WINDOW_MS) {
    if (logHits.size > 500) {
      for (const [key, value] of logHits) {
        if (now - value.start > LOG_WINDOW_MS) logHits.delete(key);
      }
    }
    logHits.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= LOG_MAX_REQUESTS;
}

function handleLog(req, res) {
  if (!allowLog(clientIp(req))) return sendJson(res, 429, { error: 'rate_limited' });
  let size = 0;
  let tooLarge = false;
  const chunks = [];
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > LOG_MAX_BYTES) {
      tooLarge = true;
      chunks.length = 0;
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (tooLarge) return sendJson(res, 413, { error: 'payload_too_large' });
    try {
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const kind = ['error', 'rejection', 'webgl', 'sdk', 'manual'].includes(payload.kind) ? payload.kind : 'other';
      const message = String(payload.message || '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 500);
      if (!message) return sendJson(res, 400, { error: 'bad_request' });
      console.warn(`[client:${kind}] ${message}`);
      return sendJson(res, 202, { ok: true });
    } catch {
      return sendJson(res, 400, { error: 'bad_request' });
    }
  });
  req.on('error', () => {});
}

const server = http.createServer((req, res) => {
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || process.env.RENDER === 'true';
  setSecurityHeaders(res, isHttps);

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return sendJson(res, 400, { error: 'bad_request' });
  }

  if (req.method === 'POST' && pathname === '/log') return handleLog(req, res);
  if (pathname === '/log') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  if (pathname === '/healthz') {
    return sendJson(res, 200, { ok: true });
  }

  if (!pathname || pathname === '/') pathname = '/index.html';
  if (pathname.length > 200 || pathname.includes('\0') || pathname.split('/').includes('..')) {
    return sendJson(res, 400, { error: 'bad_request' });
  }

  const entry = PUBLIC_FILES.get(pathname);
  if (!entry) return sendJson(res, 404, { error: 'not_found' });

  const filePath = path.join(BASE_DIR, entry.file);
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) return sendJson(res, 404, { error: 'not_found' });
    const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag, 'Cache-Control': entry.cache });
      return res.end();
    }
    if (entry.file === 'index.html') {
      fs.readFile(filePath, 'utf8', (readError, source) => {
        if (readError) return sendJson(res, 500, { error: 'internal_error' });
        const body = Buffer.from(source.replace(LOG_META, '<meta name="lukap-log" content="/log">'), 'utf8');
        res.writeHead(200, {
          'Content-Type': entry.type,
          'Content-Length': body.length,
          'Cache-Control': entry.cache,
          ETag: etag
        });
        if (req.method === 'HEAD') return res.end();
        return res.end(body);
      });
      return;
    }
    res.writeHead(200, {
      'Content-Type': entry.type,
      'Content-Length': stat.size,
      'Cache-Control': entry.cache,
      ETag: etag
    });
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) sendJson(res, 500, { error: 'internal_error' });
      else res.destroy();
    });
    stream.pipe(res);
  });
});

server.headersTimeout = 10000;
server.requestTimeout = 15000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`LUKAP listening on ${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  });
}
