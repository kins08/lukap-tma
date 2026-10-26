'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { computeOutfit, rollRarity } = require('../lib/outfit.js');

const SLOT_KEYS = ['hair', 'top', 'bottom', 'shoes', 'accessory'];
const COLLECTIONS = { noir: { id: 'noir', name: 'NOIRÉ' }, old: { id: 'old', name: 'OLD MANOR' } };
const SET_BONUS = { 5: 20, 4: 14, 3: 7, 2: 2 };

function outfit(equipped, items) {
  return computeOutfit(equipped, {
    slotKeys: SLOT_KEYS,
    getItem: (id) => items[id],
    setBonus: SET_BONUS,
    collections: COLLECTIONS
  });
}

test('computeOutfit handles an empty set', () => {
  const result = outfit({}, {});
  assert.deepEqual(result.items, []);
  assert.equal(result.score, 0);
  assert.equal(result.setCount, 0);
  assert.equal(result.setBonus, 0);
  assert.equal(result.collection, null);
  assert.equal(result.full, false);
});

test('computeOutfit adds the full-set bonus', () => {
  const items = {};
  SLOT_KEYS.forEach((slot, index) => {
    items[`noir-${slot}`] = { id: `noir-${slot}`, slot, points: 10, collection: 'noir', index };
  });
  const equipped = Object.fromEntries(SLOT_KEYS.map((slot) => [slot, `noir-${slot}`]));
  const result = outfit(equipped, items);
  assert.equal(result.base, 50);
  assert.equal(result.setCount, 5);
  assert.equal(result.setBonus, 20);
  assert.equal(result.score, 70);
  assert.equal(result.collection.name, 'NOIRÉ');
  assert.equal(result.full, true);
});

test('computeOutfit counts a mixed set by its largest collection', () => {
  const items = {
    a: { points: 6, collection: 'noir' },
    b: { points: 6, collection: 'noir' },
    c: { points: 6, collection: 'noir' },
    d: { points: 6, collection: 'old' },
    e: { points: 6, collection: 'old' }
  };
  const result = outfit({ hair: 'a', top: 'b', bottom: 'c', shoes: 'd', accessory: 'e' }, items);
  assert.equal(result.setCount, 3);
  assert.equal(result.setBonus, 7);
  assert.equal(result.score, 37);
  assert.equal(result.full, false);
});

test('rollRarity follows the published drop table', () => {
  const table = { base: 60.62, norm: 27, trend: 10, couture: 2, legend: 0.35, icon: 0.03 };
  let seed = 123456789;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const counts = Object.fromEntries(Object.keys(table).map((key) => [key, 0]));
  const iterations = 1_000_000;
  for (let index = 0; index < iterations; index += 1) counts[rollRarity(random, table)] += 1;
  for (const rarity of ['base', 'norm', 'trend', 'couture']) {
    const actual = (counts[rarity] / iterations) * 100;
    assert.ok(Math.abs(actual - table[rarity]) <= 0.1, `${rarity}: ${actual.toFixed(2)}% vs ${table[rarity]}%`);
  }
});

test('rollRarity falls back to base above the table ceiling', () => {
  assert.equal(rollRarity(() => 0.999, { base: 1 }), 'base');
});
