'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  safeText,
  safeColor,
  safeId,
  clampInt,
  escapeHTML,
  randomUnit,
  ownValue,
  deepFreeze
} = require('../lib/security');

test('safeText strips markup characters and bounds length', () => {
  assert.equal(safeText('<img src=x onerror=alert(1)>Куртка'), 'img src=x onerror=alert(1)Куртка');
  assert.equal(safeText('a'.repeat(100), 10).length, 10);
  assert.equal(safeText(null), '');
});

test('safeColor accepts only hex colors', () => {
  assert.equal(safeColor('#aabbcc'), '#aabbcc');
  assert.equal(safeColor('red'), '#34343a');
  assert.equal(safeColor('url(javascript:alert(1))'), '#34343a');
});

test('safeId produces a safe identifier', () => {
  assert.equal(safeId('a"b<c>'), 'a-b-c-');
  assert.equal(safeId(''), 'item');
});

test('clampInt rejects NaN, Infinity and out-of-range values', () => {
  assert.equal(clampInt('42', 0, 100), 42);
  assert.equal(clampInt('nope', 0, 100, 7), 7);
  assert.equal(clampInt(Infinity, 0, 100, 7), 7);
  assert.equal(clampInt(-5, 0, 100), 0);
  assert.equal(clampInt(500, 0, 100), 100);
});

test('escapeHTML encodes all HTML-sensitive characters', () => {
  assert.equal(escapeHTML('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
});

test('ownValue does not resolve prototype keys', () => {
  assert.equal(ownValue({ a: 1 }, 'a'), 1);
  assert.equal(ownValue({}, '__proto__'), undefined);
  assert.equal(ownValue({}, 'constructor'), undefined);
});

test('deepFreeze protects nested configuration', () => {
  const value = { nested: { a: 1 } };
  deepFreeze(value);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.nested), true);
});

test('randomUnit stays in [0, 1)', () => {
  for (let index = 0; index < 100; index += 1) {
    const value = randomUnit();
    assert.ok(value >= 0 && value < 1);
  }
});
