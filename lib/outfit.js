(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LUKAP_OUTFIT = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function computeOutfit(equipped, options) {
    const config = options || {};
    const slotKeys = config.slotKeys || [];
    const getItem = config.getItem || (() => undefined);
    const collections = config.collections || {};
    const setBonusTable = config.setBonus || {};
    const items = slotKeys.map((slot) => getItem(equipped[slot])).filter(Boolean);
    const base = items.reduce((sum, item) => sum + item.points, 0);
    const counts = {};
    items.forEach((item) => {
      counts[item.collection] = (counts[item.collection] || 0) + 1;
    });
    let setKey = null;
    let setCount = 0;
    Object.entries(counts).forEach(([key, count]) => {
      if (count > setCount) {
        setKey = key;
        setCount = count;
      }
    });
    const setBonus = setBonusTable[setCount] || 0;
    return {
      items,
      base,
      setKey,
      setCount,
      setBonus,
      score: Math.min(100, base + setBonus),
      collection: setKey ? (collections[setKey] || null) : null,
      full: items.length === slotKeys.length && setCount === slotKeys.length
    };
  }

  function rollRarity(randomUnit, dropTable) {
    const roll = randomUnit() * 100;
    let cursor = 0;
    for (const [rarityId, chance] of Object.entries(dropTable)) {
      cursor += chance;
      if (roll < cursor) return rarityId;
    }
    return 'base';
  }

  return { computeOutfit, rollRarity };
});
