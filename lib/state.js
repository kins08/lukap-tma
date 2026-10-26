(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LUKAP_STATE = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function migrateState(saved, currentVersion, clampInt) {
    const source = { ...(saved || {}) };
    const version = clampInt(source.version, 0, currentVersion, 0);
    if (version < 1) {
      source.version = 1;
    }
    // Version 2 keeps the same shape; later schema changes go here, gated by version.
    source.version = currentVersion;
    return source;
  }

  return { migrateState };
});
