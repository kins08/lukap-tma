'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const DROP_TABLE = { base: 60.62, norm: 27, trend: 10, couture: 2, legend: 0.35, icon: 0.03 };
const SELL = { base: 45, norm: 90, trend: 170, couture: 550, legend: 1800, icon: 28000 };
const SPIN_COST = 100;

function rollRarity() {
  const roll = Math.random() * 100;
  let cursor = 0;
  for (const [rarity, chance] of Object.entries(DROP_TABLE)) {
    cursor += chance;
    if (roll < cursor) return rarity;
  }
  return 'base';
}

test('sell-all expected value stays below spin cost', () => {
  const ev = Object.keys(DROP_TABLE).reduce((sum, rarity) => sum + (DROP_TABLE[rarity] / 100) * SELL[rarity], 0);
  assert.ok(ev < SPIN_COST, `EV ${ev} must be below ${SPIN_COST}`);
});

test('drop distribution tracks the published table', () => {
  const runs = 300000;
  const counts = {};
  for (let index = 0; index < runs; index += 1) {
    const rarity = rollRarity();
    counts[rarity] = (counts[rarity] || 0) + 1;
  }
  for (const [rarity, expected] of Object.entries(DROP_TABLE)) {
    if (expected < 1) continue;
    const actual = (counts[rarity] || 0) / runs * 100;
    assert.ok(Math.abs(actual - expected) < 0.5, `${rarity}: ${actual}% vs ${expected}%`);
  }
});
