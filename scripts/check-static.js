'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { CSP_HEADER, CSP_META } = require('../config/csp');

const root = path.resolve(__dirname, '..');
const required = [
  'index.html',
  'app.js',
  'avatar3d.js',
  'item-art.js',
  'lib/security.js',
  'lib/outfit.js',
  'lib/state.js',
  'data/leaderboard-mock.js',
  'config/csp.js',
  'app.css',
  'fonts/cormorant-garamond-cyrillic.woff2',
  'fonts/cormorant-garamond-latin.woff2',
  'fonts/manrope-cyrillic.woff2',
  'fonts/manrope-latin.woff2',
  'fonts/unbounded-cyrillic.woff2',
  'fonts/unbounded-latin.woff2',
  'fonts/OFL.txt',
  'vendor/three.min.js',
  '_headers',
  'robots.txt',
  'server.js',
  'package.json',
  'render.yaml',
  'wrangler.toml',
  'scripts/build-static.js',
  'scripts/check-static.js'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required file: ${file}`);
}

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const packageJson = JSON.parse(read('package.json'));
if (!packageJson.scripts || !packageJson.scripts.start || !packageJson.scripts.build) {
  throw new Error('package.json must define start and build scripts');
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) throw new Error(`Duplicate HTML ids: ${duplicateIds.join(', ')}`);

const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
for (const ref of refs) {
  if (/^(?:https?:|data:|#)/.test(ref)) continue;
  const local = ref.split('?')[0];
  if (!fs.existsSync(path.join(root, local))) throw new Error(`Broken local asset reference: ${ref}`);
}

const sdk = '<script src="https://telegram.org/js/telegram-web-app.js"></script>';
if (!html.includes(sdk)) throw new Error('Telegram WebApp SDK script is missing');
if (!html.includes('<meta name="lukap-log" content="">')) throw new Error('Client log meta placeholder is missing');
const dataIndex = html.indexOf('src="data/leaderboard-mock.js');
const libIndex = html.indexOf('src="lib/security.js');
const outfitIndex = html.indexOf('src="lib/outfit.js');
const stateIndex = html.indexOf('src="lib/state.js');
const appIndex = html.indexOf('src="app.js');
if (dataIndex < 0 || appIndex < 0 || dataIndex > appIndex) throw new Error('Leaderboard mock must load before app.js');
if (libIndex < 0 || libIndex > appIndex) throw new Error('Security helpers must load before app.js');
if (outfitIndex < 0 || outfitIndex > appIndex) throw new Error('Outfit helpers must load before app.js');
if (stateIndex < 0 || stateIndex > appIndex) throw new Error('State helpers must load before app.js');

const vendorHash = crypto.createHash('sha384').update(fs.readFileSync(path.join(root, 'vendor/three.min.js'))).digest('base64');
const expectedIntegrity = `sha384-${vendorHash}`;
if (!html.includes(`integrity="${expectedIntegrity}"`)) {
  throw new Error('Three.js SRI does not match vendor/three.min.js');
}

const headers = read('_headers').replace(/\r\n/g, '\n');
const headerCsp = headers.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1]?.trim();
if (headerCsp !== CSP_HEADER) throw new Error('_headers CSP differs from config/csp.js');
if (!headers.includes('/app.js\n  Cache-Control: public, max-age=31536000, immutable')) throw new Error('_headers is missing asset caching');

const metaCsp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1];
if (metaCsp !== CSP_META) throw new Error('index.html CSP meta differs from config/csp.js');

const server = read('server.js');
if (!server.includes('CSP_HEADER')) throw new Error('server.js must use config/csp.js');
if (!server.includes('Strict-Transport-Security')) throw new Error('server.js is missing HSTS');
if (!server.includes('content="/log"')) throw new Error('server.js does not inject the client log endpoint');

const wrangler = read('wrangler.toml');
if (!wrangler.includes('pages_build_output_dir = "./dist"')) throw new Error('wrangler.toml must publish dist');

for (const file of ['app.js', 'avatar3d.js', 'item-art.js', 'lib/security.js', 'lib/outfit.js', 'lib/state.js', 'data/leaderboard-mock.js', 'config/csp.js', 'server.js', 'scripts/build-static.js', 'scripts/check-static.js', 'scripts/check-catalog.js', 'scripts/e2e-smoke.js', 'scripts/simulate-economy.js']) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
}

console.log(`STATIC CHECK OK · ${ids.length} HTML ids · SRI ${vendorHash.slice(0, 12)}… · ${required.length} required files`);
