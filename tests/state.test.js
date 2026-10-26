'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { migrateState } = require('../lib/state.js');
const { clampInt } = require('../lib/security.js');

test('a save without a version migrates to version 2 without losing data', () => {
  const saved = { wallet: 777, inventory: { 'noir-top-norm': 3 }, equipped: { top: 'noir-top-norm' } };
  const migrated = migrateState(saved, 2, clampInt);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.wallet, 777);
  assert.equal(migrated.inventory['noir-top-norm'], 3);
  assert.equal(migrated.equipped.top, 'noir-top-norm');
  assert.equal(saved.version, undefined, 'input must not be mutated');
});

test('version 1 saves upgrade to version 2', () => {
  const migrated = migrateState({ version: 1, wallet: 100 }, 2, clampInt);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.wallet, 100);
});

test('future versions are clamped to the current schema', () => {
  const migrated = migrateState({ version: 99, wallet: 5 }, 2, clampInt);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.wallet, 5);
});

test('empty saves still receive a version', () => {
  assert.equal(migrateState({}, 2, clampInt).version, 2);
  assert.equal(migrateState(null, 2, clampInt).version, 2);
});
