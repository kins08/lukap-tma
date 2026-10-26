'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const sim = fs.readFileSync(path.join(root, 'scripts/economy-sim.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function numberMap(source, pattern) {
  return Object.fromEntries([...source.matchAll(pattern)].map((match) => [match[1], Number(match[2])]));
}

const dropBlock = app.match(/const DROP_TABLE = \{([^}]+)\};/);
const appDrops = dropBlock ? numberMap(dropBlock[1], /(\w+):\s*([\d.]+)/g) : {};
const appSells = numberMap(app, /\{ id: '(\w+)', label: '[^']+', color: '[^']+', points: \d+, sell: (\d+) \}/g);
const simDrops = numberMap(sim.match(/const DROP_TABLE = \{([^}]+)\};/)?.[1] || '', /(\w+):\s*([\d.]+)/g);
const simSells = numberMap(sim.match(/const SELL = \{([^}]+)\};/)?.[1] || '', /(\w+):\s*(\d+)/g);

test('drop table covers six rarities and sums to 100%', () => {
  assert.deepEqual(Object.keys(appDrops).sort(), ['base', 'couture', 'icon', 'legend', 'norm', 'trend']);
  const total = Object.values(appDrops).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 100) < 0.001, `drop table sums to ${total}`);
  assert.deepEqual(appDrops, simDrops);
});

test('sell prices are monotonic and match the simulation', () => {
  const order = ['base', 'norm', 'trend', 'couture', 'legend', 'icon'];
  assert.deepEqual(Object.keys(appSells), order);
  assert.deepEqual(appSells, simSells);
  for (let index = 1; index < order.length; index += 1) {
    assert.ok(appSells[order[index]] > appSells[order[index - 1]], `${order[index]} must cost more than ${order[index - 1]}`);
  }
});

test('selling every drop stays below the spin cost over time', () => {
  const saleAll = Object.keys(appDrops).reduce((sum, rarity) => sum + (appDrops[rarity] / 100) * appSells[rarity], 0);
  assert.ok(saleAll < 100, `sale-all return ${saleAll} must stay below 100`);
});

test('spin cost, storage key and state version stay stable', () => {
  assert.equal(Number(app.match(/const SPIN_COST = (\d+);/)?.[1]), 100);
  assert.match(app, /const STORAGE_KEY = 'lukap_stage1_v13'/);
  assert.match(app, /const CURRENT_STATE_VERSION = \d+;/);
});

test('catalog coverage is checked at startup and spins never fall back to another rarity', () => {
  assert.match(app, /function buildCatalogCoverage\(\)/);
  assert.match(app, /if \(CATALOG_COVERAGE\.missing\.length\)/);
  assert.match(app, /window\.__lukapCoverage = CATALOG_COVERAGE/);
  const performSpin = app.match(/function performSpin\(\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(performSpin, /if \(!pool\.length\)/);
  assert.doesNotMatch(performSpin, /randomItemForSlot/);
});

test('top-up sheet shows the computed return, not a hardcoded 100%', () => {
  assert.match(html, /id="rtpValue"/);
  assert.doesNotMatch(html, /≈ 100%/);
  assert.match(app, /rtpValue\.textContent = `≈ \$\{Math\.round\(estimatedRtp\(\)\)\}%`/);
});

test('package scripts expose check, build, test and simulation', () => {
  for (const script of ['check', 'build', 'test', 'simulate']) {
    assert.ok(packageJson.scripts[script], `missing npm script: ${script}`);
  }
});

test('no blocked counterfeit brand names are declared in the catalog', () => {
  const blocked = ['ABIBAS', 'NIKA', 'PYMA', 'REBOK', 'VANZ', 'STOME ISLAND', 'NORTH FASE', 'LAKOSTE', 'MONCLAR', 'NEW BALANSE'];
  const brandBlock = app.match(/const CAPSULE_BRANDS = \{([\s\S]*?)\n\};/)?.[1] || '';
  assert.ok(brandBlock.length > 100, 'brand catalog must be present');
  for (const name of blocked) {
    assert.ok(!brandBlock.toUpperCase().includes(name), `blocked brand leaked into catalog: ${name}`);
  }
});
