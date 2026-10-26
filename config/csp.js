'use strict';

const CSP_HEADER = [
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

const CSP_META = CSP_HEADER.replace("; frame-ancestors 'self' https://telegram.org https://web.telegram.org https://*.telegram.org", '');

module.exports = { CSP_HEADER, CSP_META };
