'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const light = fs.readFileSync(path.join(root, 'light.css'), 'utf8');
const base = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const css = `${base}\n${light}`;

test('every inline SVG is hidden from assistive tech or named', () => {
  const tags = [...html.matchAll(/<svg\b[^>]*>/g)].map((match) => match[0]);
  const unlabeled = tags.filter((tag) => !/aria-hidden|aria-label|role="img"/.test(tag));
  assert.deepEqual(unlabeled, []);
});

test('horizontal overflow is clipped at the document boundary', () => {
  assert.match(css, /html\s*,\s*body\s*\{[^}]*overflow-x:\s*clip/s);
});

test('all interactive controls have a visible focus ring', () => {
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*2px solid/s);
  assert.match(css, /:focus-visible\s*\{[^}]*outline-offset:\s*2px/s);
});

test('disabled controls use fill, ink and cursor in addition to opacity', () => {
  for (const selector of ['.primary-btn:disabled', '.bonus-strip:disabled', '.tryon-actions .secondary-btn:disabled', '.slot-sheet-meta .mini-action:disabled']) {
    const rule = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
    assert.ok(rule, `${selector} rule is missing`);
    assert.match(rule[1], /cursor:\s*not-allowed/);
    assert.match(rule[1], /background:/);
  }
});

test('display headings can wrap inside narrow cards', () => {
  assert.match(css, /\.profile-title\s*\{[^}]*overflow-wrap:\s*break-word/s);
});
