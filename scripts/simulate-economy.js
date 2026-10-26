'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const drops = Object.fromEntries([...app.match(/const DROP_TABLE = \{([^}]+)\};/)[1].matchAll(/(\w+):\s*([\d.]+)/g)].map((m) => [m[1], Number(m[2])]));
const sells = Object.fromEntries([...app.matchAll(/\{ id: '(\w+)', label: '[^']+', color: '[^']+', points: \d+, sell: (\d+) \}/g)].map((m) => [m[1], Number(m[2])]));
const spinCost = Number(app.match(/const SPIN_COST = (\d+);/)[1]);

const marker = 'window.__lukapCoverage = CATALOG_COVERAGE;';
const catalogSource = app.slice(0, app.indexOf(marker) + marker.length);
const context = {
  window: { LUKAP_SECURITY: require('../lib/security.js'), LEADERBOARD_MOCK: { week: [], all: [], friends: [] }, addEventListener() {} },
  document: { getElementById: () => null, querySelector: () => null },
  navigator: {},
  console,
  crypto: globalThis.crypto,
  Uint32Array,
  setTimeout,
  clearTimeout
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(catalogSource, context, { filename: 'app.js#catalog' });
const items = vm.runInContext('ITEMS', context);
const pools = {};
for (const item of items) {
  pools[item.slot] ||= {};
  pools[item.slot][item.rarity] = (pools[item.slot][item.rarity] || 0) + 1;
}
const slots = Object.keys(pools);
const rarities = Object.keys(drops);

const saleValue = rarities.reduce((sum, rarity) => sum + (drops[rarity] / 100) * sells[rarity], 0);
const rtpAll = (saleValue / spinCost) * 100;
const SPINS = 1_000_000;
const owned = new Set();
let duplicateSales = 0;
let duplicateDrops = 0;
let seed = 20261026;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const rollRarity = () => {
  let roll = random() * 100;
  for (const rarity of rarities) {
    roll -= drops[rarity];
    if (roll < 0) return rarity;
  }
  return 'base';
};

for (let spin = 0; spin < SPINS; spin += 1) {
  const rarity = rollRarity();
  const slot = slots[Math.floor(random() * slots.length)];
  const pool = pools[slot]?.[rarity] || 0;
  if (!pool) continue;
  const index = Math.floor(random() * pool);
  const key = `${slot}:${rarity}:${index}`;
  if (owned.has(key)) {
    duplicateSales += sells[rarity];
    duplicateDrops += 1;
  } else {
    owned.add(key);
  }
}

const iconChance = drops.icon / 100;
const iconProbability = (n) => (1 - Math.pow(1 - iconChance, n)) * 100;
console.log(JSON.stringify({
  items: items.length,
  spinCost,
  saleValuePerSpin: +saleValue.toFixed(2),
  rtpAll: +rtpAll.toFixed(2),
  rtpDuplicates: +((duplicateSales / (SPINS * spinCost)) * 100).toFixed(2),
  duplicateShare: +((duplicateDrops / SPINS) * 100).toFixed(1),
  iconsPer100: +iconProbability(100).toFixed(2),
  iconsPer500: +iconProbability(500).toFixed(2),
  iconsPer1000: +iconProbability(1000).toFixed(2)
}, null, 2));
