'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4173;
const INDEX = path.join(ROOT, 'index.html');
const PUBLIC_FILES = new Map([
  ['/index.html', { file: 'index.html', type: 'text/html; charset=utf-8', cache: 'no-cache' }],
  ['/app.js', { file: 'app.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/avatar3d.js', { file: 'avatar3d.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/item-art.js', { file: 'item-art.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/light.css', { file: 'light.css', type: 'text/css; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/styles.css', { file: 'styles.css', type: 'text/css; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/vendor/three.min.js', { file: 'vendor/three.min.js', type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' }],
  ['/robots.txt', { file: 'robots.txt', type: 'text/plain; charset=utf-8', cache: 'public, max-age=86400' }]
]);

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://telegram.org https://*.telegram.org",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://telegram.org https://*.telegram.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
  "frame-ancestors 'self' https://telegram.org https://web.telegram.org https://*.telegram.org"
].join('; ');

function setSecurityHeaders(res, isHttps) {
  res.setHeader('Content-Security-Policy', CSP);
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

const server = http.createServer((req, res) => {
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || process.env.RENDER === 'true';
  setSecurityHeaders(res, isHttps);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return sendJson(res, 400, { error: 'bad_request' });
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

  const filePath = path.join(ROOT, entry.file);
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) return sendJson(res, 404, { error: 'not_found' });
    const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag, 'Cache-Control': entry.cache });
      return res.end();
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
