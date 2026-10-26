'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const marker = 'window.__lukapCoverage = CATALOG_COVERAGE;';
const markerIndex = source.indexOf(marker);
if (markerIndex < 0) throw new Error('Cannot find catalog coverage marker in app.js');

const context = {
  window: {
    LUKAP_SECURITY: require('../lib/security.js'),
    LEADERBOARD_MOCK: { week: [], all: [], friends: [] },
    addEventListener() {}
  },
  document: {
    getElementById: () => null,
    querySelector: () => null
  },
  navigator: {},
  console,
  crypto: globalThis.crypto,
  Uint32Array,
  setTimeout,
  clearTimeout
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source.slice(0, markerIndex + marker.length), context, { filename: 'app.js#catalog' });

const items = vm.runInContext('ITEMS', context);
const coverage = vm.runInContext('CATALOG_COVERAGE', context);
if (!Array.isArray(items) || !coverage || !coverage.table) throw new Error('Catalog did not initialize');
if (coverage.missing.length) {
  console.error('CATALOG CHECK FAILED · empty cells:', coverage.missing.join(', '));
  process.exit(1);
}

const slots = Object.keys(coverage.table);
const rarities = Object.keys(Object.values(coverage.table)[0] || {});
const width = Math.max(...rarities.map((rarity) => rarity.length));
console.log(`CATALOG CHECK OK · ${items.length} items · ${slots.length} slots × ${rarities.length} rarities`);
console.log(['slot'.padEnd(12), ...rarities.map((rarity) => rarity.padStart(width))].join(' '));
for (const slot of slots) {
  console.log([slot.padEnd(12), ...rarities.map((rarity) => String(coverage.table[slot][rarity]).padStart(width))].join(' '));
}
