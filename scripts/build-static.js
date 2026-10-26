'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = [
  'index.html',
  'app.js',
  'avatar3d.js',
  'item-art.js',
  'lib/security.js',
  'lib/outfit.js',
  'lib/state.js',
  'data/leaderboard-mock.js',
  'light.css',
  'styles.css',
  'vendor/three.min.js',
  '_headers',
  'robots.txt'
];
const versioned = [
  'app.js',
  'avatar3d.js',
  'item-art.js',
  'lib/security.js',
  'lib/outfit.js',
  'lib/state.js',
  'data/leaderboard-mock.js',
  'light.css',
  'styles.css',
  'vendor/three.min.js'
];

for (const file of files) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing build input: ${file}`);
}

const hash = crypto.createHash('sha256');
for (const file of versioned) {
  hash.update(file);
  hash.update(fs.readFileSync(path.join(root, file)));
}
const version = hash.digest('hex').slice(0, 10);

fs.rmSync(output, { recursive: true, force: true });
for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (file === 'index.html') {
    const html = fs.readFileSync(source, 'utf8').replace(/\?v=\d+/g, `?v=${version}`);
    fs.writeFileSync(target, html, 'utf8');
  } else {
    fs.copyFileSync(source, target);
  }
}
console.log(`Static build ready: ${files.length} files -> dist/ (version ${version})`);
