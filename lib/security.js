(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LUKAP_SECURITY = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function safeText(value, maxLength = 80) {
    return String(value ?? '').replace(/[<>&"'`]/g, '').trim().slice(0, maxLength);
  }

  function safeColor(value, fallback = '#34343a') {
    const pattern = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
    return typeof value === 'string' && pattern.test(value) ? value : fallback;
  }

  function safeId(value) {
    const id = String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 96);
    return id || 'item';
  }

  function clampInt(value, min, max, fallback = min) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.trunc(number))) : fallback;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function randomUnit() {
    try {
      const values = new Uint32Array(1);
      globalThis.crypto.getRandomValues(values);
      return values[0] / 4294967296;
    } catch {
      return Math.random();
    }
  }

  function ownValue(object, key) {
    return object && Object.prototype.hasOwnProperty.call(object, key) ? object[key] : undefined;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  return { safeText, safeColor, safeId, clampInt, escapeHTML, randomUnit, ownValue, deepFreeze };
});
