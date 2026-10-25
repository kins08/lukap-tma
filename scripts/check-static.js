'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const required = [
  'index.html',
  'app.js',
  'avatar3d.js',
  'item-art.js',
  'light.css',
  'styles.css',
  'vendor/three.min.js',
  '_headers',
  'robots.txt',
  'server.js',
  'package.json',
  'render.yaml',
  'wrangler.toml'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required file: ${file}`);
}
if (fs.existsSync(path.join(root, 'zcode-pack.js'))) throw new Error('Rejected zcode-pack.js is present');

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

const vendorHash = crypto.createHash('sha384').update(fs.readFileSync(path.join(root, 'vendor/three.min.js'))).digest('base64');
const expectedIntegrity = `sha384-${vendorHash}`;
if (!html.includes(`integrity="${expectedIntegrity}"`)) {
  throw new Error('Three.js SRI does not match vendor/three.min.js');
}

const headers = read('_headers').replace(/\r\n/g, '\n');
if (!headers.includes('Content-Security-Policy:')) throw new Error('_headers is missing CSP');
if (!headers.includes('frame-ancestors')) throw new Error('_headers is missing frame-ancestors');
if (!headers.includes('/app.js\n  Cache-Control: public, max-age=31536000, immutable')) throw new Error('_headers is missing asset caching');

const server = read('server.js');
if (!server.includes('Content-Security-Policy')) throw new Error('server.js is missing CSP');
if (!server.includes('frame-ancestors')) throw new Error('server.js is missing frame-ancestors');
if (!server.includes('Strict-Transport-Security')) throw new Error('server.js is missing HSTS');

const wrangler = read('wrangler.toml');
if (!wrangler.includes('pages_build_output_dir = "./dist"')) throw new Error('wrangler.toml must publish dist');

for (const file of ['app.js', 'avatar3d.js', 'item-art.js', 'server.js', 'scripts/build-static.js', 'scripts/check-static.js']) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
}

console.log(`STATIC CHECK OK · ${ids.length} HTML ids · SRI ${vendorHash.slice(0, 12)}… · ${required.length} required files`);
