'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = [
  'index.html',
  'app.js',
  'avatar3d.js',
  'item-art.js',
  'light.css',
  'styles.css',
  'vendor/three.min.js',
  '_headers',
  'robots.txt'
];

fs.rmSync(output, { recursive: true, force: true });
for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(output, file);
  if (!fs.existsSync(source)) throw new Error(`Missing build input: ${file}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
console.log(`Static build ready: ${files.length} files -> dist/`);
