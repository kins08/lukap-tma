'use strict';

const $ = (id) => document.getElementById(id);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const BLOCKED_BRAND_NAMES = ['ABIBAS', 'NIKA', 'PYMA', 'REBOK', 'VANZ', 'STOME ISLAND', 'NORTH FASE', 'LAKOSTE', 'MONCLAR', 'NEW BALANSE'];
const BLOCKED_BRAND_RE = new RegExp(BLOCKED_BRAND_NAMES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
const {
  safeText,
  safeColor,
  safeId,
  clampInt,
  escapeHTML,
  randomUnit,
  ownValue,
  deepFreeze
} = window.LUKAP_SECURITY;

const CLIENT_DIAGNOSTICS = [];
const LOG_ENDPOINT = document.querySelector('meta[name="lukap-log"]')?.content || '';
const REPORTED_MESSAGES = new Set();
function recordDiagnostic(kind, value) {
  const message = String(value ?? '').slice(0, 300);
  if (CLIENT_DIAGNOSTICS.length >= 20) CLIENT_DIAGNOSTICS.shift();
  CLIENT_DIAGNOSTICS.push({ kind, message, at: Date.now() });
  if (!LOG_ENDPOINT || !navigator.sendBeacon || REPORTED_MESSAGES.has(message)) return;
  REPORTED_MESSAGES.add(message);
  try {
    navigator.sendBeacon(LOG_ENDPOINT, new Blob([JSON.stringify({ kind, message })], { type: 'application/json' }));
  } catch {
    // Logging must never break the app.
  }
}
window.addEventListener('error', (event) => recordDiagnostic('error', event.message));
window.addEventListener('unhandledrejection', (event) => recordDiagnostic('rejection', event.reason?.message || event.reason));

const SLOTS = [
  { id: 'hair', label: 'Волосы', short: 'Волосы', icon: 'i-hair' },
  { id: 'top', label: 'Верх', short: 'Верх', icon: 'i-top' },
  { id: 'bottom', label: 'Низ', short: 'Низ', icon: 'i-bottom' },
  { id: 'shoes', label: 'Обувь', short: 'Обувь', icon: 'i-shoe' },
  { id: 'accessory', label: 'Аксессуар', short: 'Аксесс.', icon: 'i-acc' }
];
const SLOT_KEYS = SLOTS.map((slot) => slot.id);
const SLOT_BY_ID = Object.fromEntries(SLOTS.map((slot) => [slot.id, slot]));

const RARITIES = [
  { id: 'base', label: 'База', color: '#69645D', points: 6, sell: 45 },
  { id: 'norm', label: 'Норма', color: '#14834A', points: 8, sell: 90 },
  { id: 'trend', label: 'Тренд', color: '#6C8300', points: 10, sell: 170 },
  { id: 'couture', label: 'Кутюр', color: '#C95300', points: 12, sell: 550 },
  { id: 'legend', label: 'Легенда', color: '#986000', points: 14, sell: 1800 },
  { id: 'icon', label: 'Икона', color: '#C92318', points: 16, sell: 28000 }
];
const RARITY_META = Object.fromEntries(RARITIES.map((rarity) => [rarity.id, rarity]));
const RARITY_ORDER = Object.fromEntries(RARITIES.map((rarity, index) => [rarity.id, index]));

const COLLECTIONS = {
  noir: {
    id: 'noir',
    name: 'NOIRÉ',
    tier: 'icon',
    tierLabel: 'ИКОНА',
    cost: 399,
    title: 'ПОЛНАЯ ТИШИНА',
    tagline: 'Минимализм · чёрный · серебро',
    rarities: ['base', 'norm', 'trend', 'couture', 'legend', 'icon'],
    palettes: [
      { main: '#34343a', accent: '#a4a4ae', detail: '#7f201c', metal: '#c4c6cc', hair: '#1c1c1f', hairHi: '#3d3d43' },
      { main: '#28282e', accent: '#b9b9c3', detail: '#96221d', metal: '#d0d2d8', hair: '#18181b', hairHi: '#38383e' },
      { main: '#1d1d22', accent: '#c8c8d0', detail: '#ab241e', metal: '#d8dade', hair: '#141416', hairHi: '#303036' },
      { main: '#151519', accent: '#d6d6dd', detail: '#b72a22', metal: '#e0e1e4', hair: '#111113', hairHi: '#2a2a2f' },
      { main: '#0f0f12', accent: '#e4e0d8', detail: '#c52d24', metal: '#e8e9ec', hair: '#0e0e10', hairHi: '#27272b' },
      { main: '#08080a', accent: '#f0e7d6', detail: '#d9342a', metal: '#f0f1f3', hair: '#0a0a0c', hairHi: '#242428' }
    ]
  },
  old: {
    id: 'old',
    name: 'OLD MANOR',
    tier: 'atelier',
    tierLabel: 'АТЕЛЬЕ',
    cost: 249,
    title: 'НАСЛЕДИЕ',
    tagline: 'Крем · камель · золото',
    rarities: ['base', 'norm', 'trend', 'couture', 'legend'],
    palettes: [
      { main: '#8d765b', accent: '#d3b178', detail: '#5a3d2a', metal: '#c79b51', hair: '#3a2a1f', hairHi: '#6a4b31' },
      { main: '#9d8567', accent: '#ddbd84', detail: '#61432d', metal: '#d0a55a', hair: '#3f2d20', hairHi: '#735133' },
      { main: '#b39a76', accent: '#e5c58e', detail: '#6b4b31', metal: '#d8b268', hair: '#463224', hairHi: '#7d5a39' },
      { main: '#cab28d', accent: '#e7cc9b', detail: '#755335', metal: '#dfbd7e', hair: '#4d3827', hairHi: '#866341' },
      { main: '#e3d1b0', accent: '#caa05e', detail: '#6e4c31', metal: '#e5bd72', hair: '#4f3928', hairHi: '#896543' }
    ]
  },
  street: {
    id: 'street',
    name: 'STREET CØDE',
    tier: 'street',
    tierLabel: 'УЛИЦА',
    cost: 149,
    title: 'КОД УЛИЦ',
    tagline: 'Бетон · трафик · красный',
    rarities: ['base', 'norm', 'trend', 'couture'],
    palettes: [
      { main: '#3e3e45', accent: '#a8a8b2', detail: '#b72c24', metal: '#c5c7cd', hair: '#151517', hairHi: '#34343a' },
      { main: '#2c2c32', accent: '#b9b9c2', detail: '#d02f27', metal: '#d0d2d7', hair: '#121214', hairHi: '#303036' },
      { main: '#202025', accent: '#c7c7cf', detail: '#ee3d32', metal: '#d9dbe0', hair: '#101012', hairHi: '#2d2d32' },
      { main: '#271a1a', accent: '#ff6257', detail: '#ff6a00', metal: '#d3d5db', hair: '#0d0d0f', hairHi: '#2b2b30' }
    ]
  },
  muse: {
    id: 'muse',
    name: 'MUZE',
    tier: 'studio',
    tierLabel: 'СТУДИЯ',
    cost: 299,
    title: 'ТИХИЙ БЛЕСК',
    tagline: 'Бордо · пудра · жемчуг',
    rarities: ['base', 'norm', 'trend', 'couture', 'legend'],
    palettes: [
      { main: '#5d3a3a', accent: '#d8b7a8', detail: '#7c3f44', metal: '#c8a46b', hair: '#2c1d1c', hairHi: '#543833' },
      { main: '#7b4448', accent: '#e7c9b9', detail: '#4d2529', metal: '#d8b17b', hair: '#34211f', hairHi: '#5f3c36' },
      { main: '#a8676b', accent: '#f0d8cb', detail: '#6b3035', metal: '#e0bc83', hair: '#3d2622', hairHi: '#70483e' },
      { main: '#d3a49f', accent: '#f7e6dc', detail: '#8f4b50', metal: '#e8c99b', hair: '#4a2d28', hairHi: '#7c5347' },
      { main: '#c9978d', accent: '#a84e59', detail: '#57282d', metal: '#d8ae68', hair: '#3a2723', hairHi: '#68493e' }
    ]
  },
  sport: {
    id: 'sport',
    name: 'SPORT DEPT.',
    tier: 'street',
    tierLabel: 'СПОРТ',
    cost: 199,
    title: 'ДВИЖЕНИЕ',
    tagline: 'Трибуна · сетка · скорость',
    rarities: ['base', 'norm', 'trend', 'couture', 'legend', 'icon'],
    palettes: [
      { main: '#e7dfd0', accent: '#c83a2f', detail: '#2b2a28', metal: '#b9bcc2', hair: '#2b211b', hairHi: '#5c4130' },
      { main: '#34383a', accent: '#9aa63a', detail: '#c83a2f', metal: '#c6c8cc', hair: '#171514', hairHi: '#3b3632' },
      { main: '#1c1c1f', accent: '#e8e3d9', detail: '#d23a2f', metal: '#d2d4d8', hair: '#101012', hairHi: '#302d2b' },
      { main: '#2c3f36', accent: '#e6dbc5', detail: '#c85a32', metal: '#cbb27a', hair: '#231c16', hairHi: '#4c3b2c' },
      { main: '#9e2f2a', accent: '#f0e6d6', detail: '#2a2522', metal: '#d6b26b', hair: '#2a1e18', hairHi: '#583c2c' },
      { main: '#d9d2c4', accent: '#242426', detail: '#b8342a', metal: '#bfc2c7', hair: '#241d18', hairHi: '#513c2d' }
    ]
  }
};

// Sell-all EV = 94.28 per 100-coin spin. Monte Carlo (1000 users, 750 spins max):
// duplicate-only RTP 3.31%, average final wallet 50, 0% of collectors in profit.
const DROP_TABLE = { base: 60.62, norm: 27, trend: 10, couture: 2, legend: 0.35, icon: 0.03 };
const SPIN_COST = 100;

const NAME_BANK = {
  noir: {
    hair: ['Полночь', 'Пробор', 'Тень', 'Глянец', 'Волна', 'Сталь'],
    top: ['Тишина', 'Ателье', 'Контур', 'Каркас', 'Пиджак', 'Минус'],
    bottom: ['Лезвие', 'Стрелка', 'Свод', 'Жёсткость', 'Линия', 'Сгиб'],
    shoes: ['Свинец', 'Груз', 'Шаг', 'Острие', 'Подошва', 'Полночь'],
    accessory: ['Минус', 'Оправа', 'Сталь', 'Печать', 'Игла', 'Холод']
  },
  old: {
    hair: ['Наследие', 'Волна', 'Пробор', 'Клуб', 'Сезон'],
    top: ['Клуб', 'Камея', 'Герб', 'Пиджак', 'Наследие'],
    bottom: ['Камея', 'Стрелка', 'Клуб', 'Галс', 'Сезон'],
    shoes: ['Яхта', 'Клуб', 'Наследие', 'Галс', 'Старый свет'],
    accessory: ['Аукцион', 'Печать', 'Герб', 'Клуб', 'Цепь']
  },
  street: {
    hair: ['Код', 'Двор', 'Бетон', 'Ветер'],
    top: ['Код', 'Двор', 'Сетка', 'Бетон'],
    bottom: ['Двор', 'Карго', 'Бетон', 'Поток'],
    shoes: ['Бетон', 'Прыжок', 'Двор', 'След'],
    accessory: ['Провод', 'Код', 'Двор', 'Бетон']
  },
  muse: {
    hair: ['Волна', 'Пробор', 'Боб', 'Флоу', 'Пикси'],
    top: ['Кроп', 'Лонгслив', 'Рубашка', 'Бомбер', 'Жилет'],
    bottom: ['Юбка-мини', 'Клёш', 'Бэгги', 'Парашют', 'Карго-макси'],
    shoes: ['Балетки', 'Мюли', 'Платформы', 'Ботильоны', 'Лоферы'],
    accessory: ['Кольца', 'Серьги', 'Жемчуг', 'Очки', 'Цепь']
  },
  sport: {
    hair: ['Фейд', 'Флоу', 'Кудри', 'Боб', 'Пикси', 'Маллет'],
    top: ['Спорт-ти', 'Лонгслив', 'Ветровка', 'Худи', 'Жилет', 'Джерси'],
    bottom: ['Джоггеры', 'Бэгги', 'Парашют', 'Клёш', 'Джорты', 'Трек'],
    shoes: ['Раннеры', 'Кроссовки', 'Темпо', 'Платформы', 'Бутсы', 'Марафон'],
    accessory: ['Вайзор', 'Хроно', 'Цепь', 'Кольца', 'Таймер', 'Очки']
  }
};

const START_OWNED = [
  'noir-hair-extra-crop',
  'noir-top-extra-longsleeve-1',
  'old-bottom-extra-flare-1',
  'street-shoes-base',
  'street-accessory-base',
  'street-hair-extra-flow',
  'noir-hair-norm',
  'old-hair-base',
  'noir-top-norm',
  'street-top-norm',
  'old-top-base',
  'noir-bottom-norm',
  'old-bottom-base',
  'street-bottom-base',
  'noir-shoes-norm',
  'street-shoes-norm',
  'old-shoes-norm',
  'muse-accessory-extra-rings-1',
  'noir-accessory-norm',
  'old-accessory-norm',
  'street-accessory-norm'
];

const DEFAULT_EQUIPPED = {
  hair: 'noir-hair-extra-crop',
  top: 'noir-top-extra-longsleeve-1',
  bottom: 'old-bottom-extra-flare-1',
  shoes: 'street-shoes-base',
  accessory: 'muse-accessory-extra-rings-1'
};

const SKINS = [
  { name: 'Тёплый', skin: '#c68b63', shadow: '#815038' },
  { name: 'Глубокий', skin: '#8e5a3e', shadow: '#593624' },
  { name: 'Светлый', skin: '#e0af88', shadow: '#a87554' }
];

const HAIR_TEXTURES = [
  { id: 'straight', label: 'Прямые' },
  { id: 'wavy', label: 'Волнистые' },
  { id: 'curly', label: 'Кудрявые' }
];

function hairTextureLabel(id = state.hairTexture) {
  const texture = HAIR_TEXTURES.find((entry) => entry.id === id) || HAIR_TEXTURES[0];
  return texture.label;
}

const WATCH_DIALS = [
  { id: 'classic', label: 'Классик', face: '#f3e7d2', ink: '#2a2520', accent: '#a88855', style: 'classic' },
  { id: 'minimal', label: 'Минимал', face: '#f8f2e6', ink: '#322c26', accent: '#9e8d70', style: 'minimal' },
  { id: 'chrono', label: 'Хроно', face: '#1a1a1c', ink: '#e8d6b2', accent: '#c75542', style: 'chrono' },
  { id: 'digital', label: 'Диджитал', face: '#111417', ink: '#9fd8b4', accent: '#6fbf8c', style: 'digital' },
  { id: 'guilloche', label: 'Гийош', face: '#ddd3c0', ink: '#3a332b', accent: '#ad8b55', style: 'guilloche' },
  { id: 'roman', label: 'Римский', face: '#f1e6d2', ink: '#2c2721', accent: '#a17f4d', style: 'roman' },
  { id: 'moon', label: 'Луна', face: '#1e2420', ink: '#e9ddc4', accent: '#c9a45c', style: 'moon' },
  { id: 'gmt', label: 'GMT', face: '#203027', ink: '#f0e6d3', accent: '#c44536', style: 'gmt' },
  { id: 'skeleton', label: 'Скелетон', face: '#272321', ink: '#e5d6bd', accent: '#b98d4e', style: 'skeleton' },
  { id: 'panda', label: 'Панда', face: '#f4efe5', ink: '#1f1d1b', accent: '#242424', style: 'panda' },
  { id: 'meteorite', label: 'Метеорит', face: '#6d655b', ink: '#f2e9d8', accent: '#c9a45c', style: 'meteorite' },
  { id: 'sunburst', label: 'Солнце', face: '#8d2b25', ink: '#f3e7d2', accent: '#e0b36b', style: 'sunburst' }
];
const WATCH_STRAPS = [
  { id: 'leather', label: 'Кожа', color: '#65402d', metalness: 0.04, roughness: 0.62 },
  { id: 'steel', label: 'Сталь', color: '#b9bcc2', metalness: 0.64, roughness: 0.32 },
  { id: 'black', label: 'Чёрный', color: '#242428', metalness: 0.08, roughness: 0.48 },
  { id: 'gold', label: 'Золото', color: '#c9a45c', metalness: 0.7, roughness: 0.3 },
  { id: 'rubber', label: 'Каучук', color: '#313739', metalness: 0.02, roughness: 0.82 },
  { id: 'suede', label: 'Замша', color: '#8a6a4f', metalness: 0.02, roughness: 0.9 },
  { id: 'twotone', label: 'Двухтон', color: '#b9bcc2', metalness: 0.62, roughness: 0.32 },
  { id: 'nato', label: 'NATO', color: '#4f5c45', metalness: 0.02, roughness: 0.86 }
];
window.LUKAP_WATCH_DIALS = WATCH_DIALS;
window.LUKAP_WATCH_STRAPS = WATCH_STRAPS;

const WATCH_FAMILY_LABELS = {
  dress: 'КОСТЮМНЫЕ',
  diver: 'ДАЙВЕР',
  chrono: 'ХРОНОГРАФ',
  gmt: 'GMT',
  field: 'ПОЛЕВЫЕ',
  digital: 'ЦИФРОВЫЕ'
};

function watchDialLabel(id = state.watchDial) {
  const dial = WATCH_DIALS.find((entry) => entry.id === id) || WATCH_DIALS[0];
  return dial.label;
}

function watchStrapLabel(id = state.watchStrap) {
  const strap = WATCH_STRAPS.find((entry) => entry.id === id) || WATCH_STRAPS[0];
  return strap.label;
}

const STORAGE_KEY = 'lukap_stage1_v13';
const CURRENT_STATE_VERSION = 2;
const SET_BONUS = { 5: 20, 4: 14, 3: 7, 2: 2 };

const LEADERBOARDS = window.LEADERBOARD_MOCK || { week: [], all: [], friends: [] };

function shade(hex, percent) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
  const number = parseInt(full, 16);
  const target = percent < 0 ? 0 : 255;
  const amount = Math.abs(percent) / 100;
  const channels = [16, 8, 0].map((shift) => {
    const channel = (number >> shift) & 255;
    return Math.round((target - channel) * amount + channel);
  });
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatCoins(value) {
  return formatNumber(value);
}

function formatCoinsLong(value) {
  return `${formatNumber(value)} монет`;
}

function formatChance(value) {
  return `${value.toFixed(2).replace('.', ',').replace(/,00$/, '')}%`;
}

function chanceDenominator(value) {
  return value > 0 ? Math.round(100 / value) : 0;
}

function estimatedDropValue() {
  return RARITIES.reduce((sum, rarity) => sum + (DROP_TABLE[rarity.id] / 100) * rarity.sell, 0);
}

function estimatedRtp() {
  return (estimatedDropValue() / SPIN_COST) * 100;
}

let oddsRendered = false;
function renderSpinOdds() {
  const host = $('spinOdds');
  if (!host || oddsRendered) return;
  host.innerHTML = `
    <span class="spin-odds-title"><span>ШАНСЫ НА ПРОКРУТ</span><span>ОДИН ПРЕДМЕТ · БЕЗ СКРЫТЫХ ПОРОГОВ</span></span>
    ${RARITIES.map((rarity) => `<span class="spin-odds-chip" style="--rarity:${rarity.color}"><i></i>${rarity.label.toUpperCase()}<b>${formatChance(DROP_TABLE[rarity.id])}</b></span>`).join('')}`;
  oddsRendered = true;
}

function pipColor(rarityId) {
  return (RARITY_META[rarityId] && RARITY_META[rarityId].color) || '#d6cdbf';
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function itemLabel(item) {
  if (item.labelName) return `«${item.labelName}»`;
  const label = item.brand && !item.name.startsWith(item.brand) ? `${item.brand} ${item.name}` : item.name;
  return `«${label}»`;
}

function itemIcon(item) {
  if (item.slot === 'hair') {
    if (item.variant === 'curls') return 'i-hair-curls';
    if (item.variant === 'mohawk') return 'i-hair-mohawk';
    return 'i-hair';
  }
  if (item.slot === 'top') {
    if (item.variant === 'hoodie') return 'i-hoodie';
    if (item.variant === 'racer') return 'i-racer';
    return 'i-jacket';
  }
  if (item.slot === 'bottom') {
    if (item.variant === 'cargo') return 'i-cargo';
    if (item.variant === 'wide') return 'i-wide';
    return 'i-bottom';
  }
  if (item.slot === 'shoes') {
    if (item.variant === 'boot') return 'i-boot';
    if (item.variant === 'sneaker') return 'i-sneaker';
    return 'i-shoe';
  }
  if (item.variant === 'visor') return 'i-visor';
  if (item.variant === 'belt') return 'i-belt';
  return 'i-acc';
}

function variantFor(collectionId, slotId, rarityIndex) {
  if (collectionId === 'sport') {
    if (slotId === 'hair') return ['crop', 'flow', 'curls', 'bob', 'pixie', 'mullet'][rarityIndex];
    if (slotId === 'top') return ['tee', 'longsleeve', 'bomber', 'hoodie', 'vest', 'shirt'][rarityIndex];
    if (slotId === 'bottom') return ['track', 'baggy', 'parachute', 'flare', 'jorts', 'wide'][rarityIndex];
    if (slotId === 'shoes') return ['runner', 'sneaker', 'runner', 'platform', 'boot', 'runner'][rarityIndex];
    return ['glasses', 'watch', 'chain', 'rings', 'watch', 'visor'][rarityIndex];
  }
  if (collectionId === 'muse') {
    if (slotId === 'hair') return ['curls', 'slick', 'bob', 'flow', 'pixie'][rarityIndex];
    if (slotId === 'top') return ['tee', 'longsleeve', 'shirt', 'bomber', 'vest'][rarityIndex];
    if (slotId === 'bottom') return ['skirt', 'flare', 'baggy', 'parachute', 'skirt'][rarityIndex];
    if (slotId === 'shoes') return ['ballet', 'mule', 'platform', 'boot', 'loafer'][rarityIndex];
    return ['rings', 'earrings', 'pearls', 'glasses', 'chain'][rarityIndex];
  }
  if (slotId === 'hair') {
    if (collectionId === 'street') return rarityIndex > 1 ? 'mohawk' : 'slick';
    return rarityIndex >= 2 && rarityIndex <= 3 ? 'curls' : 'slick';
  }
  if (slotId === 'top') {
    if (collectionId === 'street') return 'hoodie';
    return rarityIndex >= 2 && rarityIndex <= 3 ? 'racer' : 'blazer';
  }
  if (slotId === 'bottom') {
    if (collectionId === 'street') return 'cargo';
    if (collectionId === 'old') return rarityIndex >= 3 ? 'wide' : 'tailored';
    return 'tailored';
  }
  if (slotId === 'shoes') {
    if (collectionId === 'street') return 'sneaker';
    return rarityIndex >= 4 ? 'boot' : 'loafer';
  }
  if (collectionId === 'old') return 'gold';
  if (collectionId === 'street') return 'visor';
  return 'glasses';
}

const COLLECTION_STYLES = { noir: 'МИНИМАЛ', old: 'ОЛД-МАНИ', street: 'СТРИТ', muse: 'СТУДИЯ', sport: 'СПОРТ' };
const HAIR_LENGTH_BY_VARIANT = {
  crop: 'short', fade: 'short', pixie: 'short', slick: 'short', mohawk: 'short', buzz: 'short',
  bob: 'medium', lob: 'medium', wolf: 'medium', mullet: 'medium', shag: 'medium', curls: 'medium',
  flow: 'long', curtain: 'medium', long: 'long', waves: 'long'
};
const HAIR_LENGTH_LABELS = { short: 'КОРОТКИЕ', medium: 'СРЕДНИЕ', long: 'ДЛИННЫЕ' };
const BELT_MATERIAL_LABELS = { leather: 'КОЖА', suede: 'ЗАМША', webbing: 'КАНВАС', chain: 'ЦЕПЬ', patent: 'ПАТЕНТ' };
const TOP_FIT_LABELS = { tailored: 'ПО ФИГУРЕ', oversize: 'ОВЕРСАЙЗ', slim: 'СЛИМ', regular: 'РЕГУЛЯР', cropped: 'КРОП', boxy: 'БОКСИ' };
const RISE_LABELS = { high: 'ВЫСОКАЯ ПОСАДКА', mid: 'СРЕДНЯЯ ПОСАДКА', low: 'НИЗКАЯ ПОСАДКА' };
const CUT_LABELS = { straight: 'ПРЯМЫЕ', cargo: 'КАРГО', wide: 'ШИРОКИЕ', flare: 'КЛЁШ', bootcut: 'БУТКАТ', baggy: 'БЭГГИ', parachute: 'ПАРАШЮТ', track: 'ДЖОГГЕРЫ', leggings: 'ЛЕГГИНСЫ', skirt: 'ЮБКА', jorts: 'ШОРТЫ', capri: 'КАПРИ' };
const SHOE_LABELS = { loafer: 'ЛОФЕРЫ', boot: 'БОТИНКИ', sneaker: 'КРОССОВКИ', platform: 'ПЛАТФОРМЫ', mule: 'МЮЛИ', ballet: 'БАЛЕТКИ', runner: 'РАННЕРЫ', derby: 'ДЕРБИ' };
const SOLE_LABELS = { low: 'НИЗКАЯ ПОДОШВА', mid: 'СРЕДНЯЯ ПОДОШВА', high: 'ВЫСОКАЯ ПОДОШВА', max: 'МАКСИ-ПОДОШВА' };
const UPPER_LABELS = { mesh: 'СЕТКА', suede: 'ЗАМША', leather: 'КОЖА', nubuck: 'НУБУК', canvas: 'КАНВАС', knit: 'ТРИКОТАЖ', satin: 'САТИН' };
const ACC_LABELS = { glasses: 'ОЧКИ', gold: 'ЦЕПЬ И ЧАСЫ', visor: 'ВАЙЗОР', rings: 'КОЛЬЦА', chain: 'ЦЕПЬ', pearls: 'ЖЕМЧУГ', earrings: 'СЕРЬГИ', watch: 'ЧАСЫ', beanie: 'БИНИ', scarf: 'ШАРФ', bag: 'СУМКА', brooch: 'БРОШЬ', belt: 'РЕМЕНЬ' };

function defaultFitFor(item) {
  if (item.slot === 'top') {
    if (item.variant === 'hoodie' || item.variant === 'bomber' || item.variant === 'tank') return 'oversize';
    if (item.variant === 'racer' || item.variant === 'longsleeve') return 'slim';
    if (item.variant === 'blazer' || item.variant === 'vest') return 'tailored';
    return 'regular';
  }
  if (item.slot === 'bottom') {
    if (item.variant === 'flare' || item.variant === 'skirt') return 'high';
    if (item.variant === 'baggy' || item.variant === 'jorts') return 'low';
    return 'mid';
  }
  return null;
}

function defaultCutFor(item) {
  if (item.slot !== 'bottom') return null;
  if (item.variant === 'tailored') return 'straight';
  return CUT_LABELS[item.variant] ? item.variant : null;
}

function itemFitLabel(item) {
  if (item.slot === 'hair') return HAIR_LENGTH_LABELS[item.hairLength] || '';
  if (item.slot === 'bottom') {
    return [RISE_LABELS[item.fit], CUT_LABELS[item.cut]].filter(Boolean).join(' · ');
  }
  if (item.slot === 'top') return TOP_FIT_LABELS[item.fit] || '';
  if (item.slot === 'shoes') {
    if (item.uggs) return `УГГИ · ${SOLE_LABELS[item.sole] || ''} · ${UPPER_LABELS[item.upper] || ''}`.replace(/ · $/, '');
    return [SHOE_LABELS[item.variant] || '', SOLE_LABELS[item.sole] || '', UPPER_LABELS[item.upper] || ''].filter(Boolean).join(' · ');
  }
  if (item.slot === 'accessory') {
    if (item.variant === 'glasses' && item.shape === 'cat') return 'ОЧКИ-КИСКИ';
    if (item.variant === 'glasses' && item.shape === 'rect') return 'ОЧКИ-РЕТРО';
    if (item.variant === 'watch' && item.watchFamily) return `${WATCH_FAMILY_LABELS[item.watchFamily] || ''} · ${ACC_LABELS.watch}`;
    if (item.variant === 'belt') return `${BELT_MATERIAL_LABELS[item.beltMaterial] || BELT_MATERIAL_LABELS.leather} · ${ACC_LABELS.belt}`;
    return ACC_LABELS[item.variant] || '';
  }
  return '';
}

function finalizeItem(item) {
  if (!ownValue(COLLECTIONS, item.collection) || !ownValue(SLOT_BY_ID, item.slot)) {
    item.invalidCatalog = true;
    return;
  }
  item.id = safeId(item.id);
  item.name = safeText(item.name, 80) || 'Архив';
  item.brand = item.brand ? safeText(item.brand, 32) : null;
  if (item.brand && (!ownValue(CAPSULE_BRANDS, item.brand) || BLOCKED_BRAND_NAMES.includes(item.brand.toUpperCase()))) {
    item.brand = null;
    item.forceUnbranded = true;
  }
  if (BLOCKED_BRAND_RE.test(item.name)) {
    item.name = item.name.replace(BLOCKED_BRAND_RE, 'ARCHIVE').replace(/\s+/g, ' ').trim();
  }
  const rarity = RARITY_META[item.rarity] || RARITY_META.base;
  item.rarity = rarity.id;
  item.points = rarity.points;
  item.sell = rarity.sell;
  item.palette = {
    main: safeColor(item.palette?.main, '#34343a'),
    accent: safeColor(item.palette?.accent, '#a4a4ae'),
    detail: safeColor(item.palette?.detail, '#7f201c'),
    metal: safeColor(item.palette?.metal, '#c4c6cc'),
    hair: safeColor(item.palette?.hair, '#1c1c1f'),
    hairHi: safeColor(item.palette?.hairHi, '#3d3d43')
  };
  if (!item.fit) item.fit = defaultFitFor(item);
  if (!item.cut) item.cut = defaultCutFor(item);
  const lowerName = item.name.toLowerCase();
  if (item.variant === 'skirt') {
    if (!item.length) item.length = lowerName.includes('мини') ? 'mini' : lowerName.includes('макси') ? 'maxi' : 'midi';
    if (item.cargo === undefined) item.cargo = lowerName.includes('карго');
  }
  if (item.variant === 'glasses' && !item.shape) {
    item.shape = lowerName.includes('киск') ? 'cat' : lowerName.includes('ретро') ? 'rect' : 'round';
  }
  if (!item.brand && item.slot !== 'hair' && !item.forceUnbranded) {
    const houses = HOUSE_ASSIGN[item.collection] || [];
    let hash = 0;
    for (let index = 0; index < item.id.length; index += 1) hash = (hash * 31 + item.id.charCodeAt(index)) % 997;
    if (houses.length && hash % 10 < 9) item.brand = houses[hash % houses.length];
  }
  if (item.brand && !item.mark) item.mark = CAPSULE_BRANDS[item.brand]?.mark || null;
  item.brandLine = item.brand ? CAPSULE_BRANDS[item.brand]?.line || '' : '';
  item.variant = safeText(item.variant, 24);
  item.hairLength = item.slot === 'hair' ? (HAIR_LENGTH_BY_VARIANT[item.variant] || 'medium') : null;
  item.beltMaterial = ['leather', 'suede', 'webbing', 'chain', 'patent'].includes(item.beltMaterial) ? item.beltMaterial : null;
  item.model = item.model ? safeText(item.model, 60) : null;
  item.sole = item.sole ? safeText(item.sole, 12) : null;
  item.upper = item.upper ? safeText(item.upper, 12) : null;
  item.soleType = item.soleType ? safeText(item.soleType, 12) : null;
  item.watchFamily = WATCH_FAMILY_LABELS[item.watchFamily] ? item.watchFamily : null;
  item.mark = ['wing', 'slash', 'peak', 'orbit', 'sun', 'monogram', 'bolt', 'diamond', 'arc', 'wave'].includes(item.mark) ? item.mark : null;
  item.shape = ['rect', 'cat', 'round'].includes(item.shape) ? item.shape : (item.variant === 'glasses' ? 'round' : null);
  item.style = safeText(item.style || COLLECTION_STYLES[item.collection] || '', 40);
  item.fitLabel = itemFitLabel(item);
  item.metaLine = `${COLLECTIONS[item.collection].name} · ${SLOT_BY_ID[item.slot].label.toUpperCase()}${item.fitLabel ? ` · ${item.fitLabel}` : ''}${item.brand ? ` · ${item.brand}` : ''}`;
}

const ITEMS = [];
for (const collection of Object.values(COLLECTIONS)) {
  for (const slot of SLOTS) {
    collection.rarities.forEach((rarityId, index) => {
      const rarity = RARITY_META[rarityId];
      ITEMS.push({
        id: `${collection.id}-${slot.id}-${rarityId}`,
        collection: collection.id,
        slot: slot.id,
        rarity: rarityId,
        name: NAME_BANK[collection.id][slot.id][index],
        variant: variantFor(collection.id, slot.id, index),
        palette: collection.palettes[index],
        points: rarity.points,
        sell: rarity.sell,
        index: ITEMS.length + 1
      });
    });
  }
}

const EXTRA_HAIR = [
  { collection: 'noir', rarity: 'norm', name: 'Кроп', variant: 'crop', paletteIndex: 1 },
  { collection: 'noir', rarity: 'trend', name: 'Флоу', variant: 'flow', paletteIndex: 2 },
  { collection: 'noir', rarity: 'couture', name: 'Штора', variant: 'curtain', paletteIndex: 3 },
  { collection: 'old', rarity: 'norm', name: 'Флоу', variant: 'flow', paletteIndex: 1 },
  { collection: 'old', rarity: 'trend', name: 'Кроп', variant: 'crop', paletteIndex: 2 },
  { collection: 'old', rarity: 'couture', name: 'Фейд', variant: 'fade', paletteIndex: 3 },
  { collection: 'street', rarity: 'base', name: 'Кроп', variant: 'crop', paletteIndex: 0 },
  { collection: 'street', rarity: 'norm', name: 'Флоу', variant: 'flow', paletteIndex: 1 },
  { collection: 'street', rarity: 'trend', name: 'Фейд', variant: 'fade', paletteIndex: 2 }
];

EXTRA_HAIR.forEach((entry) => {
  const collection = COLLECTIONS[entry.collection];
  const rarity = RARITY_META[entry.rarity];
  ITEMS.push({
    id: `${entry.collection}-hair-extra-${entry.variant}`,
    collection: entry.collection,
    slot: 'hair',
    rarity: entry.rarity,
    name: entry.name,
    variant: entry.variant,
    palette: collection.palettes[entry.paletteIndex],
    points: rarity.points,
    sell: rarity.sell,
    index: ITEMS.length + 1
  });
});

const CAPSULE_BRANDS = {
  'VÉLOCE': { mark: 'wing', line: 'RUN DIVISION · PARIS' },
  STADION: { mark: 'slash', line: 'COURT CLUB · MILANO' },
  TERRAIN: { mark: 'peak', line: 'OUTDOOR UNIT · OSLO' },
  HORLOGE: { mark: 'orbit', line: 'HORLOGERIE · GENÈVE' },
  AUREL: { mark: 'sun', line: 'MAISON · PARIS 1908' },
  NOCTURNE: { mark: 'monogram', line: 'ARCHIVE · PARIS' },
  'SÈVE': { mark: 'bolt', line: 'ATELIER · PARIS' },
  SABLE: { mark: 'diamond', line: 'MAISON · GENÈVE' },
  CAELUM: { mark: 'arc', line: 'ATELIER · MILANO' },
  'RIVE GAUCHE': { mark: 'wave', line: 'GALERIE · PARIS' }
};
const HOUSE_ASSIGN = {
  noir: ['NOCTURNE', 'SÈVE'],
  old: ['SABLE', 'AUREL', 'HORLOGE'],
  street: ['RIVE GAUCHE', 'VÉLOCE', 'STADION', 'TERRAIN'],
  muse: ['CAELUM', 'SABLE', 'AUREL'],
  sport: ['VÉLOCE', 'STADION', 'TERRAIN']
};
window.LUKAP_BRANDS = CAPSULE_BRANDS;

const EXTRA_ITEMS = [
  // NOIR · минимал / архив / техно
  { collection: 'noir', slot: 'top', rarity: 'base', name: 'Кроп-ти', variant: 'tee', paletteIndex: 0, fit: 'cropped', style: 'МИНИМАЛ' },
  { collection: 'noir', slot: 'top', rarity: 'norm', name: 'Лонгслив', variant: 'longsleeve', paletteIndex: 1, fit: 'slim', style: 'АРХИВ' },
  { collection: 'noir', slot: 'top', rarity: 'trend', name: 'Бомбер', variant: 'bomber', paletteIndex: 2, fit: 'oversize', style: 'ТЕХНО' },
  { collection: 'noir', slot: 'top', rarity: 'couture', name: 'Жилет', variant: 'vest', paletteIndex: 3, fit: 'tailored', style: 'АРХИВ' },
  { collection: 'noir', slot: 'bottom', rarity: 'base', name: 'Джоггеры', variant: 'track', paletteIndex: 0, fit: 'mid', style: 'ТЕХНО' },
  { collection: 'noir', slot: 'bottom', rarity: 'norm', name: 'Клёш', variant: 'flare', paletteIndex: 1, fit: 'high', style: 'МИНИМАЛ' },
  { collection: 'noir', slot: 'bottom', rarity: 'trend', name: 'Парашют', variant: 'parachute', paletteIndex: 2, fit: 'mid', style: 'ТЕХНО' },
  { collection: 'noir', slot: 'bottom', rarity: 'couture', name: 'Юбка-миди', variant: 'skirt', paletteIndex: 3, fit: 'high', length: 'midi', style: 'МИНИМАЛ' },
  { collection: 'noir', slot: 'shoes', rarity: 'base', name: 'Платформы', variant: 'platform', paletteIndex: 0, style: 'ТЕХНО' },
  { collection: 'noir', slot: 'shoes', rarity: 'norm', name: 'Мюли', variant: 'mule', paletteIndex: 1, style: 'МИНИМАЛ' },
  { collection: 'noir', slot: 'shoes', rarity: 'trend', name: 'Раннеры', variant: 'runner', paletteIndex: 2, style: 'ТЕХНО' },
  { collection: 'noir', slot: 'accessory', rarity: 'base', name: 'Кольца', variant: 'rings', paletteIndex: 0, style: 'МИНИМАЛ' },
  { collection: 'noir', slot: 'accessory', rarity: 'norm', name: 'Цепь', variant: 'chain', paletteIndex: 1, style: 'АРХИВ' },
  { collection: 'noir', slot: 'accessory', rarity: 'trend', name: 'Серьги', variant: 'earrings', paletteIndex: 2, style: 'ТЕХНО' },
  { collection: 'noir', slot: 'accessory', rarity: 'couture', name: 'Очки-ретро', variant: 'glasses', paletteIndex: 3, shape: 'rect', style: 'АРХИВ' },
  { collection: 'noir', slot: 'hair', rarity: 'trend', name: 'Боб', variant: 'bob', paletteIndex: 2, style: 'МИНИМАЛ' },

  // OLD MONEY · олд-мани / регата / наследие
  { collection: 'old', slot: 'top', rarity: 'base', name: 'Рубашка', variant: 'shirt', paletteIndex: 0, fit: 'oversize', style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'top', rarity: 'norm', name: 'Поло', variant: 'tee', paletteIndex: 1, fit: 'regular', style: 'РЕГАТА' },
  { collection: 'old', slot: 'top', rarity: 'trend', name: 'Лонгслив', variant: 'longsleeve', paletteIndex: 2, fit: 'slim', style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'top', rarity: 'legend', name: 'Шёлк', variant: 'shirt', paletteIndex: 4, fit: 'oversize', style: 'НАСЛЕДИЕ' },
  { collection: 'old', slot: 'bottom', rarity: 'base', name: 'Бэгги', variant: 'baggy', paletteIndex: 0, fit: 'mid', style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'bottom', rarity: 'norm', name: 'Клёш', variant: 'flare', paletteIndex: 1, fit: 'high', style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'bottom', rarity: 'trend', name: 'Шорты', variant: 'jorts', paletteIndex: 2, fit: 'mid', style: 'РЕГАТА' },
  { collection: 'old', slot: 'bottom', rarity: 'legend', name: 'Юбка', variant: 'skirt', paletteIndex: 4, fit: 'high', length: 'midi', style: 'НАСЛЕДИЕ' },
  { collection: 'old', slot: 'shoes', rarity: 'base', name: 'Дерби', variant: 'derby', paletteIndex: 0, style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'shoes', rarity: 'norm', name: 'Балетки', variant: 'ballet', paletteIndex: 1, style: 'РЕГАТА' },
  { collection: 'old', slot: 'shoes', rarity: 'legend', name: 'Ботильоны', variant: 'boot', paletteIndex: 4, style: 'НАСЛЕДИЕ' },
  { collection: 'old', slot: 'accessory', rarity: 'base', name: 'Кольца', variant: 'rings', paletteIndex: 0, style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'accessory', rarity: 'norm', name: 'Жемчуг', variant: 'pearls', paletteIndex: 1, style: 'РЕГАТА' },
  { collection: 'old', slot: 'accessory', rarity: 'trend', name: 'Серьги', variant: 'earrings', paletteIndex: 2, style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'accessory', rarity: 'legend', name: 'Очки', variant: 'glasses', paletteIndex: 4, shape: 'round', style: 'НАСЛЕДИЕ' },
  { collection: 'old', slot: 'hair', rarity: 'trend', name: 'Волчок', variant: 'wolf', paletteIndex: 2, style: 'ОЛД-МАНИ' },

  // STREET CODE · стрит / Y2K
  { collection: 'street', slot: 'top', rarity: 'base', name: 'Лонгслив', variant: 'longsleeve', paletteIndex: 0, fit: 'oversize', style: 'СТРИТ' },
  { collection: 'street', slot: 'top', rarity: 'norm', name: 'Майка', variant: 'tank', paletteIndex: 1, fit: 'oversize', style: 'Y2K' },
  { collection: 'street', slot: 'top', rarity: 'trend', name: 'Зип-худи', variant: 'hoodie', paletteIndex: 2, fit: 'oversize', zip: true, style: 'СТРИТ' },
  { collection: 'street', slot: 'top', rarity: 'couture', name: 'Бомбер', variant: 'bomber', paletteIndex: 3, fit: 'oversize', style: 'Y2K' },
  { collection: 'street', slot: 'bottom', rarity: 'base', name: 'Бэгги', variant: 'baggy', paletteIndex: 0, fit: 'low', style: 'СТРИТ' },
  { collection: 'street', slot: 'bottom', rarity: 'norm', name: 'Парашют', variant: 'parachute', paletteIndex: 1, fit: 'low', style: 'Y2K' },
  { collection: 'street', slot: 'bottom', rarity: 'trend', name: 'Джорты', variant: 'jorts', paletteIndex: 2, fit: 'low', style: 'СТРИТ' },
  { collection: 'street', slot: 'bottom', rarity: 'couture', name: 'Клёш', variant: 'flare', paletteIndex: 3, fit: 'low', style: 'Y2K' },
  { collection: 'street', slot: 'shoes', rarity: 'base', name: 'Раннеры', variant: 'runner', paletteIndex: 0, style: 'СТРИТ' },
  { collection: 'street', slot: 'shoes', rarity: 'norm', name: 'Платформы', variant: 'platform', paletteIndex: 1, style: 'Y2K' },
  { collection: 'street', slot: 'shoes', rarity: 'couture', name: 'Ботинки', variant: 'boot', paletteIndex: 3, style: 'СТРИТ' },
  { collection: 'street', slot: 'accessory', rarity: 'base', name: 'Кольца', variant: 'rings', paletteIndex: 0, style: 'СТРИТ' },
  { collection: 'street', slot: 'accessory', rarity: 'norm', name: 'Цепь', variant: 'chain', paletteIndex: 1, style: 'СТРИТ' },
  { collection: 'street', slot: 'accessory', rarity: 'trend', name: 'Серьги', variant: 'earrings', paletteIndex: 2, style: 'Y2K' },
  { collection: 'street', slot: 'accessory', rarity: 'couture', name: 'Очки', variant: 'glasses', paletteIndex: 3, shape: 'cat', style: 'Y2K' },
  { collection: 'street', slot: 'hair', rarity: 'base', name: 'Маллет', variant: 'mullet', paletteIndex: 0, style: 'СТРИТ' },

  // MUSE · клин-герл / балеткор / тихая роскошь
  { collection: 'muse', slot: 'top', rarity: 'base', name: 'Кроп-топ', variant: 'tee', paletteIndex: 0, fit: 'cropped', style: 'КЛИН-ГЕРЛ' },
  { collection: 'muse', slot: 'top', rarity: 'norm', name: 'Лонгслив', variant: 'longsleeve', paletteIndex: 1, fit: 'slim', style: 'БАЛЕТКОР' },
  { collection: 'muse', slot: 'top', rarity: 'trend', name: 'Рубашка', variant: 'shirt', paletteIndex: 2, fit: 'oversize', style: 'ТИХАЯ РОСКОШЬ' },
  { collection: 'muse', slot: 'top', rarity: 'couture', name: 'Бомбер', variant: 'bomber', paletteIndex: 3, fit: 'cropped', style: 'КУТЮР' },
  { collection: 'muse', slot: 'top', rarity: 'legend', name: 'Жилет', variant: 'vest', paletteIndex: 4, fit: 'tailored', style: 'ПОДИУМ' },
  { collection: 'muse', slot: 'bottom', rarity: 'base', name: 'Юбка-мини', variant: 'skirt', paletteIndex: 0, fit: 'high', length: 'mini', style: 'КЛИН-ГЕРЛ' },
  { collection: 'muse', slot: 'bottom', rarity: 'norm', name: 'Бэгги', variant: 'baggy', paletteIndex: 1, fit: 'low', style: 'Y2K' },
  { collection: 'muse', slot: 'bottom', rarity: 'trend', name: 'Клёш', variant: 'flare', paletteIndex: 2, fit: 'high', style: 'ТИХАЯ РОСКОШЬ' },
  { collection: 'muse', slot: 'bottom', rarity: 'couture', name: 'Карго-макси', variant: 'skirt', paletteIndex: 3, fit: 'high', length: 'maxi', cargo: true, style: 'КУТЮР' },
  { collection: 'muse', slot: 'bottom', rarity: 'legend', name: 'Юбка-миди', variant: 'skirt', paletteIndex: 4, fit: 'high', length: 'midi', style: 'ПОДИУМ' },
  { collection: 'muse', slot: 'shoes', rarity: 'base', name: 'Балетки', variant: 'ballet', paletteIndex: 0, style: 'БАЛЕТКОР' },
  { collection: 'muse', slot: 'shoes', rarity: 'norm', name: 'Мюли', variant: 'mule', paletteIndex: 1, style: 'КЛИН-ГЕРЛ' },
  { collection: 'muse', slot: 'shoes', rarity: 'couture', name: 'Платформы', variant: 'platform', paletteIndex: 2, style: 'Y2K' },
  { collection: 'muse', slot: 'shoes', rarity: 'legend', name: 'Ботильоны', variant: 'boot', paletteIndex: 4, style: 'ПОДИУМ' },
  { collection: 'muse', slot: 'accessory', rarity: 'base', name: 'Кольца', variant: 'rings', paletteIndex: 0, style: 'КЛИН-ГЕРЛ' },
  { collection: 'muse', slot: 'accessory', rarity: 'norm', name: 'Серьги', variant: 'earrings', paletteIndex: 1, style: 'БАЛЕТКОР' },
  { collection: 'muse', slot: 'accessory', rarity: 'trend', name: 'Жемчуг', variant: 'pearls', paletteIndex: 2, style: 'ТИХАЯ РОСКОШЬ' },
  { collection: 'muse', slot: 'accessory', rarity: 'couture', name: 'Очки-киски', variant: 'glasses', paletteIndex: 3, shape: 'cat', style: 'КУТЮР' },
  { collection: 'muse', slot: 'accessory', rarity: 'legend', name: 'Серьги-люстры', variant: 'earrings', paletteIndex: 4, style: 'ПОДИУМ' },
  { collection: 'muse', slot: 'hair', rarity: 'couture', name: 'Пикси', variant: 'pixie', paletteIndex: 3, style: 'ПОДИУМ' },

  // CAPSULE 2 · NOIRÉ
  { collection: 'noir', slot: 'top', rarity: 'base', name: 'Сетка', variant: 'tee', paletteIndex: 0, fit: 'cropped', style: 'МИНИМАЛ' },
  { collection: 'noir', slot: 'top', rarity: 'trend', name: 'Стойка', variant: 'bomber', paletteIndex: 2, fit: 'oversize', style: 'ТЕХНО' },
  { collection: 'noir', slot: 'top', rarity: 'couture', name: 'Кромка', variant: 'shirt', paletteIndex: 3, fit: 'slim', style: 'АРХИВ' },
  { collection: 'noir', slot: 'bottom', rarity: 'base', name: 'Шов', variant: 'track', paletteIndex: 0, fit: 'mid', style: 'ТЕХНО' },
  { collection: 'noir', slot: 'bottom', rarity: 'trend', name: 'Пласт', variant: 'flare', paletteIndex: 2, fit: 'high', style: 'МИНИМАЛ' },
  { collection: 'noir', slot: 'bottom', rarity: 'legend', name: 'Сгиб', variant: 'skirt', paletteIndex: 4, fit: 'high', length: 'midi', style: 'АРХИВ' },
  { collection: 'noir', slot: 'shoes', rarity: 'base', name: 'Постамент', variant: 'platform', paletteIndex: 1, style: 'ТЕХНО' },
  { collection: 'noir', slot: 'shoes', rarity: 'legend', name: 'Ботинок', variant: 'boot', paletteIndex: 4, style: 'АРХИВ' },
  { collection: 'noir', slot: 'accessory', rarity: 'norm', name: 'Хроно', variant: 'watch', paletteIndex: 1, style: 'ТЕХНО' },
  { collection: 'noir', slot: 'accessory', rarity: 'trend', name: 'Гвоздь', variant: 'earrings', paletteIndex: 2, style: 'МИНИМАЛ' },
  { collection: 'noir', slot: 'hair', rarity: 'base', name: 'Пикси', variant: 'pixie', paletteIndex: 0, style: 'МИНИМАЛ' },

  // CAPSULE 2 · OLD MANOR
  { collection: 'old', slot: 'top', rarity: 'base', name: 'Лён', variant: 'shirt', paletteIndex: 0, fit: 'oversize', style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'top', rarity: 'norm', name: 'Плед', variant: 'vest', paletteIndex: 1, fit: 'tailored', style: 'РЕГАТА' },
  { collection: 'old', slot: 'top', rarity: 'couture', name: 'Костюм', variant: 'blazer', paletteIndex: 3, fit: 'tailored', style: 'НАСЛЕДИЕ' },
  { collection: 'old', slot: 'bottom', rarity: 'base', name: 'Складка', variant: 'wide', paletteIndex: 0, fit: 'mid', style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'bottom', rarity: 'norm', name: 'Прямая', variant: 'tailored', paletteIndex: 1, fit: 'mid', style: 'РЕГАТА' },
  { collection: 'old', slot: 'bottom', rarity: 'legend', name: 'Атлас', variant: 'skirt', paletteIndex: 4, fit: 'high', length: 'maxi', style: 'НАСЛЕДИЕ' },
  { collection: 'old', slot: 'shoes', rarity: 'base', name: 'Оксфорд', variant: 'derby', paletteIndex: 0, style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'shoes', rarity: 'trend', name: 'Мюли', variant: 'mule', paletteIndex: 2, style: 'РЕГАТА' },
  { collection: 'old', slot: 'accessory', rarity: 'base', name: 'Часы', variant: 'watch', paletteIndex: 0, style: 'ОЛД-МАНИ' },
  { collection: 'old', slot: 'accessory', rarity: 'trend', name: 'Печать', variant: 'rings', paletteIndex: 2, style: 'НАСЛЕДИЕ' },
  { collection: 'old', slot: 'hair', rarity: 'base', name: 'Боб', variant: 'bob', paletteIndex: 0, style: 'ОЛД-МАНИ' },

  // CAPSULE 2 · STREET CØDE
  { collection: 'street', slot: 'top', rarity: 'base', name: 'Трафик', variant: 'tee', paletteIndex: 0, fit: 'oversize', style: 'СТРИТ' },
  { collection: 'street', slot: 'top', rarity: 'norm', name: 'Сет', variant: 'tank', paletteIndex: 1, fit: 'oversize', style: 'Y2K' },
  { collection: 'street', slot: 'top', rarity: 'couture', name: 'Каркас', variant: 'bomber', paletteIndex: 3, fit: 'oversize', style: 'СТРИТ' },
  { collection: 'street', slot: 'bottom', rarity: 'base', name: 'Пыль', variant: 'baggy', paletteIndex: 0, fit: 'low', style: 'СТРИТ' },
  { collection: 'street', slot: 'bottom', rarity: 'norm', name: 'Асфальт', variant: 'track', paletteIndex: 1, fit: 'mid', style: 'Y2K' },
  { collection: 'street', slot: 'bottom', rarity: 'couture', name: 'Разрыв', variant: 'jorts', paletteIndex: 3, fit: 'low', style: 'СТРИТ' },
  { collection: 'street', slot: 'shoes', rarity: 'base', name: 'Кросс', variant: 'sneaker', paletteIndex: 0, style: 'СТРИТ' },
  { collection: 'street', slot: 'shoes', rarity: 'norm', name: 'Груз', variant: 'boot', paletteIndex: 1, style: 'Y2K' },
  { collection: 'street', slot: 'accessory', rarity: 'trend', name: 'Таймер', variant: 'watch', paletteIndex: 2, style: 'СТРИТ' },
  { collection: 'street', slot: 'accessory', rarity: 'base', name: 'Пирсинг', variant: 'earrings', paletteIndex: 0, style: 'Y2K' },
  { collection: 'street', slot: 'hair', rarity: 'trend', name: 'Ирокез', variant: 'mohawk', paletteIndex: 2, style: 'СТРИТ' },

  // CAPSULE 2 · MUZE
  { collection: 'muse', slot: 'top', rarity: 'base', name: 'Пудра', variant: 'tee', paletteIndex: 0, fit: 'cropped', style: 'КЛИН-ГЕРЛ' },
  { collection: 'muse', slot: 'top', rarity: 'norm', name: 'Атлас', variant: 'longsleeve', paletteIndex: 1, fit: 'slim', style: 'БАЛЕТКОР' },
  { collection: 'muse', slot: 'top', rarity: 'trend', name: 'Корсет', variant: 'vest', paletteIndex: 2, fit: 'tailored', style: 'ТИХАЯ РОСКОШЬ' },
  { collection: 'muse', slot: 'bottom', rarity: 'base', name: 'Складка', variant: 'skirt', paletteIndex: 0, fit: 'high', length: 'mini', style: 'КЛИН-ГЕРЛ' },
  { collection: 'muse', slot: 'bottom', rarity: 'norm', name: 'Пыль', variant: 'flare', paletteIndex: 1, fit: 'high', style: 'Y2K' },
  { collection: 'muse', slot: 'bottom', rarity: 'couture', name: 'Каскад', variant: 'skirt', paletteIndex: 3, fit: 'high', length: 'maxi', style: 'КУТЮР' },
  { collection: 'muse', slot: 'shoes', rarity: 'base', name: 'Пуанты', variant: 'ballet', paletteIndex: 0, style: 'БАЛЕТКОР' },
  { collection: 'muse', slot: 'shoes', rarity: 'norm', name: 'Слинг', variant: 'mule', paletteIndex: 1, style: 'КЛИН-ГЕРЛ' },
  { collection: 'muse', slot: 'accessory', rarity: 'couture', name: 'Цифер', variant: 'watch', paletteIndex: 3, style: 'КУТЮР' },
  { collection: 'muse', slot: 'accessory', rarity: 'trend', name: 'Камея', variant: 'pearls', paletteIndex: 2, style: 'ТИХАЯ РОСКОШЬ' },
  { collection: 'muse', slot: 'hair', rarity: 'norm', name: 'Боб', variant: 'bob', paletteIndex: 1, style: 'БАЛЕТКОР' },

  // CAPSULE 3 · SPORT DEPT. / VÉLOCE
  { collection: 'sport', slot: 'top', rarity: 'base', name: 'VÉLOCE Aero', variant: 'tee', paletteIndex: 0, fit: 'regular', brand: 'VÉLOCE', model: 'Aero' },
  { collection: 'sport', slot: 'top', rarity: 'norm', name: 'VÉLOCE Tempo', variant: 'longsleeve', paletteIndex: 2, fit: 'slim', brand: 'VÉLOCE', model: 'Tempo' },
  { collection: 'sport', slot: 'top', rarity: 'trend', name: 'VÉLOCE Windrunner', variant: 'bomber', paletteIndex: 1, fit: 'oversize', brand: 'VÉLOCE', model: 'Windrunner' },
  { collection: 'sport', slot: 'top', rarity: 'couture', name: 'VÉLOCE Storm Shell', variant: 'bomber', paletteIndex: 3, fit: 'oversize', brand: 'VÉLOCE', model: 'Storm Shell' },
  { collection: 'sport', slot: 'bottom', rarity: 'base', name: 'VÉLOCE Split', variant: 'track', paletteIndex: 0, fit: 'mid', brand: 'VÉLOCE', model: 'Split' },
  { collection: 'sport', slot: 'bottom', rarity: 'norm', name: 'VÉLOCE Stride', variant: 'track', paletteIndex: 2, fit: 'mid', brand: 'VÉLOCE', model: 'Stride' },
  { collection: 'sport', slot: 'bottom', rarity: 'trend', name: 'VÉLOCE Pace', variant: 'flare', paletteIndex: 1, fit: 'high', brand: 'VÉLOCE', model: 'Pace' },
  { collection: 'sport', slot: 'shoes', rarity: 'base', name: 'VÉLOCE Dart', variant: 'runner', paletteIndex: 0, brand: 'VÉLOCE', model: 'Dart', sole: 'low', soleType: 'waffle', upper: 'mesh' },
  { collection: 'sport', slot: 'shoes', rarity: 'norm', name: 'VÉLOCE Vector', variant: 'runner', paletteIndex: 2, brand: 'VÉLOCE', model: 'Vector', sole: 'mid', soleType: 'foam', upper: 'knit' },
  { collection: 'sport', slot: 'shoes', rarity: 'couture', name: 'VÉLOCE Apex', variant: 'runner', paletteIndex: 4, brand: 'VÉLOCE', model: 'Apex', sole: 'max', soleType: 'carbon', upper: 'mesh' },
  { collection: 'sport', slot: 'accessory', rarity: 'norm', name: 'VÉLOCE Chrono', variant: 'watch', paletteIndex: 2, brand: 'VÉLOCE', watchFamily: 'chrono' },
  { collection: 'sport', slot: 'accessory', rarity: 'base', name: 'VÉLOCE Shield', variant: 'visor', paletteIndex: 2, brand: 'VÉLOCE' },

  // CAPSULE 3 · SPORT DEPT. / STADION
  { collection: 'sport', slot: 'top', rarity: 'base', name: 'STADION Court', variant: 'tee', paletteIndex: 4, fit: 'regular', brand: 'STADION', model: 'Court' },
  { collection: 'sport', slot: 'top', rarity: 'norm', name: 'STADION Rally', variant: 'longsleeve', paletteIndex: 3, fit: 'slim', brand: 'STADION', model: 'Rally' },
  { collection: 'sport', slot: 'top', rarity: 'trend', name: 'STADION Baseline', variant: 'bomber', paletteIndex: 2, fit: 'oversize', brand: 'STADION', model: 'Baseline' },
  { collection: 'sport', slot: 'top', rarity: 'couture', name: 'STADION Ace', variant: 'vest', paletteIndex: 0, fit: 'tailored', brand: 'STADION', model: 'Ace' },
  { collection: 'sport', slot: 'bottom', rarity: 'base', name: 'STADION Serve', variant: 'track', paletteIndex: 4, fit: 'mid', brand: 'STADION', model: 'Serve' },
  { collection: 'sport', slot: 'bottom', rarity: 'norm', name: 'STADION Rally', variant: 'baggy', paletteIndex: 2, fit: 'low', brand: 'STADION', model: 'Rally' },
  { collection: 'sport', slot: 'shoes', rarity: 'base', name: 'STADION Court 88', variant: 'sneaker', paletteIndex: 0, brand: 'STADION', model: 'Court 88', sole: 'low', soleType: 'cup', upper: 'leather' },
  { collection: 'sport', slot: 'shoes', rarity: 'norm', name: 'STADION Net', variant: 'sneaker', paletteIndex: 1, brand: 'STADION', model: 'Net', sole: 'mid', soleType: 'cup', upper: 'suede' },
  { collection: 'sport', slot: 'shoes', rarity: 'trend', name: 'STADION Clay', variant: 'runner', paletteIndex: 3, brand: 'STADION', model: 'Clay', sole: 'high', soleType: 'lug', upper: 'suede' },
  { collection: 'sport', slot: 'accessory', rarity: 'trend', name: 'STADION Timeout', variant: 'watch', paletteIndex: 4, brand: 'STADION', watchFamily: 'chrono' },
  { collection: 'sport', slot: 'accessory', rarity: 'norm', name: 'STADION Linesman', variant: 'glasses', paletteIndex: 1, brand: 'STADION', shape: 'rect' },

  // CAPSULE 3 · SPORT DEPT. / TERRAIN
  { collection: 'sport', slot: 'top', rarity: 'base', name: 'TERRAIN Ridge', variant: 'longsleeve', paletteIndex: 3, fit: 'regular', brand: 'TERRAIN', model: 'Ridge' },
  { collection: 'sport', slot: 'top', rarity: 'norm', name: 'TERRAIN Summit', variant: 'bomber', paletteIndex: 1, fit: 'oversize', brand: 'TERRAIN', model: 'Summit' },
  { collection: 'sport', slot: 'top', rarity: 'trend', name: 'TERRAIN Storm', variant: 'bomber', paletteIndex: 2, fit: 'oversize', brand: 'TERRAIN', model: 'Storm' },
  { collection: 'sport', slot: 'top', rarity: 'legend', name: 'TERRAIN Alpine', variant: 'vest', paletteIndex: 3, fit: 'tailored', brand: 'TERRAIN', model: 'Alpine' },
  { collection: 'sport', slot: 'bottom', rarity: 'base', name: 'TERRAIN Trail', variant: 'parachute', paletteIndex: 3, fit: 'mid', brand: 'TERRAIN', model: 'Trail' },
  { collection: 'sport', slot: 'bottom', rarity: 'norm', name: 'TERRAIN Scout', variant: 'jorts', paletteIndex: 1, fit: 'mid', brand: 'TERRAIN', model: 'Scout' },
  { collection: 'sport', slot: 'bottom', rarity: 'couture', name: 'TERRAIN Ridge Cargo', variant: 'wide', paletteIndex: 4, fit: 'mid', cargo: true, brand: 'TERRAIN', model: 'Ridge Cargo' },
  { collection: 'sport', slot: 'shoes', rarity: 'base', name: 'TERRAIN Rock', variant: 'runner', paletteIndex: 1, brand: 'TERRAIN', model: 'Rock', sole: 'high', soleType: 'lug', upper: 'nubuck' },
  { collection: 'sport', slot: 'shoes', rarity: 'norm', name: 'TERRAIN Summit', variant: 'boot', paletteIndex: 3, brand: 'TERRAIN', model: 'Summit', sole: 'mid', soleType: 'cup', upper: 'leather' },
  { collection: 'sport', slot: 'shoes', rarity: 'trend', name: 'TERRAIN Grip', variant: 'runner', paletteIndex: 4, brand: 'TERRAIN', model: 'Grip', sole: 'max', soleType: 'tread', upper: 'suede' },
  { collection: 'sport', slot: 'shoes', rarity: 'legend', name: 'TERRAIN Alpine', variant: 'boot', paletteIndex: 2, brand: 'TERRAIN', model: 'Alpine', sole: 'high', soleType: 'lug', upper: 'nubuck' },
  { collection: 'sport', slot: 'accessory', rarity: 'base', name: 'TERRAIN Field', variant: 'watch', paletteIndex: 3, brand: 'TERRAIN', watchFamily: 'field' },
  { collection: 'sport', slot: 'accessory', rarity: 'couture', name: 'TERRAIN Peak', variant: 'glasses', paletteIndex: 4, brand: 'TERRAIN', shape: 'round' },

  // CAPSULE 3 · ЧАСОВЫЕ ДОМА
  { collection: 'sport', slot: 'accessory', rarity: 'norm', name: 'HORLOGE Diver 300', variant: 'watch', paletteIndex: 0, brand: 'HORLOGE', watchFamily: 'diver' },
  { collection: 'sport', slot: 'accessory', rarity: 'couture', name: 'HORLOGE GMT 24', variant: 'watch', paletteIndex: 1, brand: 'HORLOGE', watchFamily: 'gmt' },
  { collection: 'sport', slot: 'accessory', rarity: 'legend', name: 'HORLOGE Perpetual', variant: 'watch', paletteIndex: 2, brand: 'HORLOGE', watchFamily: 'dress' },
  { collection: 'sport', slot: 'accessory', rarity: 'icon', name: 'HORLOGE Grand Chrono', variant: 'watch', paletteIndex: 3, brand: 'HORLOGE', watchFamily: 'chrono' },
  { collection: 'sport', slot: 'accessory', rarity: 'couture', name: 'AUREL Slim 1962', variant: 'watch', paletteIndex: 4, brand: 'AUREL', watchFamily: 'dress' },
  { collection: 'sport', slot: 'accessory', rarity: 'legend', name: 'AUREL Sun', variant: 'glasses', paletteIndex: 3, brand: 'AUREL', shape: 'round' },

  // CAPSULE 3 · SPORT DEPT. / HAIR
  { collection: 'sport', slot: 'hair', rarity: 'base', name: 'Фейд', variant: 'crop', paletteIndex: 0, style: 'СПОРТ' },
  { collection: 'sport', slot: 'hair', rarity: 'norm', name: 'Флоу', variant: 'flow', paletteIndex: 1, style: 'СПОРТ' },
  { collection: 'sport', slot: 'hair', rarity: 'trend', name: 'Кудри', variant: 'curls', paletteIndex: 2, style: 'СПОРТ' },
  { collection: 'sport', slot: 'hair', rarity: 'couture', name: 'Боб', variant: 'bob', paletteIndex: 3, style: 'СПОРТ' }
];

const HOUSE_LINES = [
  {
    brand: 'NOCTURNE',
    collection: 'noir',
    tops: [
      { name: 'Aero', variant: 'tee', fit: 'regular' },
      { name: 'Null', variant: 'longsleeve', fit: 'slim' },
      { name: 'Forma', variant: 'bomber', fit: 'oversize' },
      { name: 'Slate', variant: 'shirt', fit: 'tailored' }
    ],
    bottoms: [
      { name: 'Line', variant: 'tailored', fit: 'mid' },
      { name: 'Plane', variant: 'wide', fit: 'mid' },
      { name: 'Cut', variant: 'track', fit: 'mid' }
    ],
    shoes: [
      { name: 'Slab', variant: 'platform' },
      { name: 'Point', variant: 'derby' },
      { name: 'Trace', variant: 'runner', sole: 'low', soleType: 'waffle', upper: 'mesh' }
    ],
    accessories: [
      { name: 'Halo', variant: 'rings' },
      { name: 'Mark', variant: 'glasses', shape: 'rect' }
    ]
  },
  {
    brand: 'SÈVE',
    collection: 'street',
    tops: [
      { name: 'Vector', variant: 'tee', fit: 'regular' },
      { name: 'Relay', variant: 'longsleeve', fit: 'slim' },
      { name: 'Shell', variant: 'bomber', fit: 'oversize' },
      { name: 'Grid', variant: 'vest', fit: 'tailored' }
    ],
    bottoms: [
      { name: 'Sector', variant: 'track', fit: 'mid' },
      { name: 'Rail', variant: 'parachute', fit: 'mid' },
      { name: 'Node', variant: 'baggy', fit: 'low' }
    ],
    shoes: [
      { name: 'Grip', variant: 'runner', sole: 'high', soleType: 'lug', upper: 'nubuck' },
      { name: 'Drive', variant: 'sneaker', sole: 'mid', soleType: 'cup', upper: 'leather' },
      { name: 'Stride', variant: 'platform' }
    ],
    accessories: [
      { name: 'Pulse', variant: 'watch', watchFamily: 'chrono' },
      { name: 'Code', variant: 'chain' }
    ]
  },
  {
    brand: 'SABLE',
    collection: 'old',
    tops: [
      { name: 'Heir', variant: 'shirt', fit: 'oversize' },
      { name: 'Cameo', variant: 'vest', fit: 'tailored' },
      { name: 'Crest', variant: 'bomber', fit: 'oversize' },
      { name: 'Silk', variant: 'longsleeve', fit: 'slim' }
    ],
    bottoms: [
      { name: 'Drape', variant: 'wide', fit: 'high' },
      { name: 'Pleat', variant: 'tailored', fit: 'mid' },
      { name: 'Levee', variant: 'flare', fit: 'high' }
    ],
    shoes: [
      { name: 'Derby', variant: 'derby', sole: 'low', soleType: 'cup', upper: 'leather' },
      { name: 'Slipper', variant: 'loafer' },
      { name: 'Boot', variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'suede' }
    ],
    accessories: [
      { name: 'Signet', variant: 'rings' },
      { name: 'Seal', variant: 'pearls' }
    ]
  },
  {
    brand: 'CAELUM',
    collection: 'muse',
    tops: [
      { name: 'Cloud', variant: 'tee', fit: 'cropped' },
      { name: 'Veil', variant: 'longsleeve', fit: 'slim' },
      { name: 'Aura', variant: 'shirt', fit: 'oversize' },
      { name: 'Wing', variant: 'bomber', fit: 'oversize' }
    ],
    bottoms: [
      { name: 'Mist', variant: 'flare', fit: 'high' },
      { name: 'Sweep', variant: 'wide', fit: 'high' },
      { name: 'Fall', variant: 'parachute', fit: 'mid' }
    ],
    shoes: [
      { name: 'Pointe', variant: 'ballet' },
      { name: 'Mule', variant: 'mule' },
      { name: 'Satin', variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'suede' }
    ],
    accessories: [
      { name: 'Lumen', variant: 'earrings' },
      { name: 'Drop', variant: 'glasses', shape: 'round' }
    ]
  },
  {
    brand: 'RIVE GAUCHE',
    collection: 'street',
    tops: [
      { name: 'Current', variant: 'tee', fit: 'regular' },
      { name: 'Drift', variant: 'longsleeve', fit: 'regular' },
      { name: 'Break', variant: 'hoodie', fit: 'oversize' },
      { name: 'Court', variant: 'bomber', fit: 'oversize' }
    ],
    bottoms: [
      { name: 'Tide', variant: 'baggy', fit: 'low' },
      { name: 'Flux', variant: 'track', fit: 'mid' },
      { name: 'Swell', variant: 'jorts', fit: 'low' }
    ],
    shoes: [
      { name: 'Wave', variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'mesh' },
      { name: 'Curb', variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'suede' },
      { name: 'Run', variant: 'runner', sole: 'high', soleType: 'tread', upper: 'knit' }
    ],
    accessories: [
      { name: 'Signal', variant: 'visor' },
      { name: 'Shade', variant: 'watch', watchFamily: 'field' }
    ]
  }
];
const MORE_RARITIES = ['base', 'norm', 'trend', 'couture', 'legend', 'norm', 'trend', 'couture', 'legend', 'base', 'trend', 'couture'];
const MORE_ITEMS = [];
HOUSE_LINES.forEach((house, houseIndex) => {
  const collection = COLLECTIONS[house.collection];
  let order = 0;
  const addHouseItem = (slot, spec) => {
    const rarity = MORE_RARITIES[order % MORE_RARITIES.length];
    MORE_ITEMS.push({
      collection: house.collection,
      slot,
      rarity,
      name: `${house.brand} ${spec.name}`,
      variant: spec.variant,
      fit: spec.fit || null,
      shape: spec.shape || null,
      sole: spec.sole || null,
      soleType: spec.soleType || null,
      upper: spec.upper || null,
      watchFamily: spec.watchFamily || null,
      brand: house.brand,
      model: spec.name,
      paletteIndex: (houseIndex * 2 + order) % collection.palettes.length
    });
    order += 1;
  };
  house.tops.forEach((spec) => addHouseItem('top', spec));
  house.bottoms.forEach((spec) => addHouseItem('bottom', spec));
  house.shoes.forEach((spec) => addHouseItem('shoes', spec));
  house.accessories.forEach((spec) => addHouseItem('accessory', spec));
});
EXTRA_ITEMS.push(...MORE_ITEMS);

/* ---------- ARCHIVE LINES · 10 original houses × 20 = 200 ---------- */
const ARCHIVE_MODELS = {
  top: ['Arc', 'Static', 'Rally', 'Circuit', 'Frame', 'Echo', 'Prism', 'North', 'Motion', 'Trajectory'],
  bottom: ['Path', 'Cut', 'Volume', 'Drift', 'Sweep'],
  shoes: ['Dash', 'Court', 'Tempo', 'Trail', 'Vector'],
  accessory: ['Halo', 'Signal', 'Orbit', 'Mark']
};
const ARCHIVE_TOP_SPECS = [
  { variant: 'tee', fit: 'regular' },
  { variant: 'tank', fit: 'oversize' },
  { variant: 'longsleeve', fit: 'slim' },
  { variant: 'shirt', fit: 'regular' },
  { variant: 'vest', fit: 'tailored' },
  { variant: 'bomber', fit: 'oversize' }
];
const ARCHIVE_BOTTOM_SPECS = [
  { variant: 'track', fit: 'mid' },
  { variant: 'jorts', fit: 'low' },
  { variant: 'baggy', fit: 'low' },
  { variant: 'parachute', fit: 'mid' },
  { variant: 'flare', fit: 'high' }
];
const ARCHIVE_SHOE_SPECS = [
  { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'suede' },
  { variant: 'sneaker', sole: 'mid', soleType: 'cup', upper: 'leather' },
  { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'mesh' },
  { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'nubuck' },
  { variant: 'sneaker', sole: 'high', soleType: 'cup', upper: 'leather' }
];
const ARCHIVE_ACCESSORY_SPECS = [
  { variant: 'visor' },
  { variant: 'glasses', shape: 'rect' },
  { variant: 'watch', watchFamily: 'chrono' },
  { variant: 'rings' }
];
const ARCHIVE_RARITIES = ['base', 'norm', 'norm', 'trend', 'couture', 'legend', 'base', 'trend', 'couture', 'icon', 'norm', 'trend', 'couture', 'legend', 'base', 'trend', 'couture', 'legend', 'base', 'trend'];
const ARCHIVE_HOUSES = [
  { brand: 'VÉLOCE', collection: 'sport' },
  { brand: 'STADION', collection: 'sport' },
  { brand: 'TERRAIN', collection: 'sport' },
  { brand: 'SÈVE', collection: 'street' },
  { brand: 'RIVE GAUCHE', collection: 'street' },
  { brand: 'NOCTURNE', collection: 'noir' },
  { brand: 'SABLE', collection: 'old' },
  { brand: 'AUREL', collection: 'old' },
  { brand: 'CAELUM', collection: 'muse' },
  { brand: 'HORLOGE', collection: 'sport' }
];
ARCHIVE_HOUSES.forEach((house, houseIndex) => {
  let serial = 0;
  const addArchiveItem = (slot, spec, localIndex) => {
    const rarity = ARCHIVE_RARITIES[serial];
    const model = `${ARCHIVE_MODELS[slot][localIndex]} ${String.fromCharCode(65 + houseIndex)}${serial + 1}`;
    EXTRA_ITEMS.push({
      collection: house.collection,
      slot,
      rarity,
      name: `${house.brand} ${model}`,
      variant: spec.variant,
      fit: spec.fit || null,
      shape: spec.shape || null,
      sole: spec.sole || null,
      soleType: spec.soleType || null,
      upper: spec.upper || null,
      watchFamily: spec.watchFamily || null,
      brand: house.brand,
      model,
      paletteIndex: (houseIndex * 3 + serial) % COLLECTIONS[house.collection].palettes.length,
      style: 'АРХИВ'
    });
    serial += 1;
  };
  ARCHIVE_TOP_SPECS.forEach((spec, index) => addArchiveItem('top', spec, index));
  ARCHIVE_BOTTOM_SPECS.forEach((spec, index) => addArchiveItem('bottom', spec, index));
  ARCHIVE_SHOE_SPECS.forEach((spec, index) => addArchiveItem('shoes', spec, index));
  ARCHIVE_ACCESSORY_SPECS.forEach((spec, index) => addArchiveItem('accessory', spec, index));
});

/* ---------- DROP 02 · 10 houses × 12 = 120 more branded items ---------- */
const DROP2_MODELS = {
  top: ['Volt', 'Nova', 'Pulse', 'Drift', 'Loop', 'Flux', 'Orbit', 'Vista', 'Tempo', 'Arc'],
  bottom: ['Relay', 'Stride', 'Taper', 'Motion', 'Level', 'Stream', 'Fold', 'Curve', 'Path', 'Cut'],
  shoes: ['Dash', 'Vector', 'Glide', 'Grip', 'Sprint', 'Shift', 'Cloud', 'Edge', 'Court', 'Trail'],
  accessory: ['Halo', 'Signal', 'Code', 'Point', 'Link', 'Time', 'Frame', 'Shade', 'Mark', 'Orbit']
};
const DROP2_TOP_SETS = {
  sport: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'tank', fit: 'oversize' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  street: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'tank', fit: 'oversize' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  noir: [
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' }
  ],
  old: [
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' }
  ],
  muse: [
    { variant: 'tee', fit: 'cropped' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'bomber', fit: 'oversize' }
  ]
};
const DROP2_BOTTOM_SETS = {
  sport: [
    { variant: 'track', fit: 'mid' },
    { variant: 'baggy', fit: 'low' },
    { variant: 'parachute', fit: 'mid' }
  ],
  street: [
    { variant: 'track', fit: 'mid' },
    { variant: 'baggy', fit: 'low' },
    { variant: 'jorts', fit: 'low' }
  ],
  noir: [
    { variant: 'tailored', fit: 'mid' },
    { variant: 'wide', fit: 'mid' },
    { variant: 'flare', fit: 'high' }
  ],
  old: [
    { variant: 'tailored', fit: 'mid' },
    { variant: 'wide', fit: 'high' },
    { variant: 'flare', fit: 'high' }
  ],
  muse: [
    { variant: 'flare', fit: 'high' },
    { variant: 'wide', fit: 'high' },
    { variant: 'parachute', fit: 'mid' }
  ]
};
const DROP2_SHOE_SETS = {
  sport: [
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'mesh' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'nubuck' }
  ],
  street: [
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'canvas' },
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'knit' },
    { variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'leather' }
  ],
  noir: [
    { variant: 'derby', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'leather' }
  ],
  old: [
    { variant: 'derby', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'suede' }
  ],
  muse: [
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'mule', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'suede' }
  ]
};
const DROP2_ACCESSORY_BANK = [
  { variant: 'visor' },
  { variant: 'glasses', shape: 'rect' },
  { variant: 'watch', watchFamily: 'chrono' },
  { variant: 'rings' },
  { variant: 'chain' },
  { variant: 'earrings' },
  { variant: 'pearls' },
  { variant: 'glasses', shape: 'round' },
  { variant: 'watch', watchFamily: 'field' },
  { variant: 'visor' }
];
const DROP2_RARITIES = ['base', 'norm', 'trend', 'couture', 'legend', 'icon', 'base', 'norm', 'trend', 'couture', 'legend', 'trend'];
ARCHIVE_HOUSES.forEach((house, houseIndex) => {
  const collection = COLLECTIONS[house.collection];
  const letter = String.fromCharCode(65 + houseIndex);
  let serial = 0;
  const addDropItem = (slot, spec, localIndex) => {
    const model = `${DROP2_MODELS[slot][localIndex]} ${letter}${serial + 1}R`;
    EXTRA_ITEMS.push({
      collection: house.collection,
      slot,
      rarity: DROP2_RARITIES[serial],
      name: `${house.brand} ${model}`,
      variant: spec.variant,
      fit: spec.fit || null,
      shape: spec.shape || null,
      sole: spec.sole || null,
      soleType: spec.soleType || null,
      upper: spec.upper || null,
      watchFamily: spec.watchFamily || null,
      brand: house.brand,
      model,
      paletteIndex: (houseIndex * 5 + serial) % collection.palettes.length,
      style: 'АРХИВ'
    });
    serial += 1;
  };
  const tops = DROP2_TOP_SETS[house.collection] || DROP2_TOP_SETS.noir;
  const bottoms = DROP2_BOTTOM_SETS[house.collection] || DROP2_BOTTOM_SETS.noir;
  const shoes = DROP2_SHOE_SETS[house.collection] || DROP2_SHOE_SETS.noir;
  tops.forEach((spec, index) => addDropItem('top', spec, index));
  bottoms.forEach((spec, index) => addDropItem('bottom', spec, index));
  shoes.forEach((spec, index) => addDropItem('shoes', spec, index));
  [0, 1].forEach((offset) => {
    const spec = DROP2_ACCESSORY_BANK[(houseIndex * 2 + offset) % DROP2_ACCESSORY_BANK.length];
    addDropItem('accessory', spec, offset);
  });
});


/* ---------- DROP 03 · 10 houses × 12 = 120 more branded items ---------- */
const DROP3_MODELS = {
  top: ['Astra', 'Cinder', 'Halo', 'Nexus', 'Rune', 'Sonic', 'Vertex', 'Atlas', 'Ember', 'Lumen', 'Onyx', 'Quartz'],
  bottom: ['Axis', 'Bend', 'Curve', 'Dune', 'Flux', 'Grid', 'Hinge', 'Knot', 'Lane', 'Mesh'],
  shoes: ['Arrow', 'Bolt', 'Coast', 'Drift', 'Flash', 'Ghost', 'Haven', 'Ion', 'Jet', 'Kite'],
  accessory: ['Aura', 'Bead', 'Cipher', 'Drift', 'Echo', 'Flint', 'Glow', 'Haze', 'Iris', 'Jade']
};
const DROP3_TOP_SETS = {
  sport: [
    { variant: 'tank', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'shirt', fit: 'regular' }
  ],
  street: [
    { variant: 'tank', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'regular' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'shirt', fit: 'regular' }
  ],
  noir: [
    { variant: 'tee', fit: 'cropped' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  old: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  muse: [
    { variant: 'tank', fit: 'regular' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'shirt', fit: 'oversize' }
  ]
};
const DROP3_BOTTOM_SETS = {
  sport: [
    { variant: 'parachute', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'wide', fit: 'mid' }
  ],
  street: [
    { variant: 'parachute', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'jorts', fit: 'low' }
  ],
  noir: [
    { variant: 'flare', fit: 'high' },
    { variant: 'jorts', fit: 'low' },
    { variant: 'tailored', fit: 'mid' }
  ],
  old: [
    { variant: 'flare', fit: 'high' },
    { variant: 'jorts', fit: 'low' },
    { variant: 'tailored', fit: 'mid' }
  ],
  muse: [
    { variant: 'parachute', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'wide', fit: 'high' }
  ]
};
const DROP3_SHOE_SETS = {
  sport: [
    { variant: 'runner', sole: 'high', soleType: 'tread', upper: 'knit' },
    { variant: 'sneaker', sole: 'mid', soleType: 'cup', upper: 'nubuck' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' }
  ],
  street: [
    { variant: 'runner', sole: 'max', soleType: 'carbon', upper: 'mesh' },
    { variant: 'sneaker', sole: 'mid', soleType: 'cup', upper: 'nubuck' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede' }
  ],
  noir: [
    { variant: 'derby', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'platform', sole: 'max', soleType: 'lug', upper: 'leather' }
  ],
  old: [
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'derby', sole: 'mid', soleType: 'cup', upper: 'nubuck' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede' }
  ],
  muse: [
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'mule', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'suede' }
  ]
};
const DROP3_ACCESSORY_BANK = [
  { variant: 'visor' },
  { variant: 'glasses', shape: 'rect' },
  { variant: 'watch', watchFamily: 'gmt' },
  { variant: 'chain' },
  { variant: 'earrings' },
  { variant: 'glasses', shape: 'cat' },
  { variant: 'watch', watchFamily: 'dress' },
  { variant: 'rings' },
  { variant: 'pearls' },
  { variant: 'watch', watchFamily: 'chrono' }
];
const DROP3_RARITIES = ['base', 'norm', 'trend', 'couture', 'legend', 'icon', 'base', 'norm', 'trend', 'couture', 'legend', 'trend'];
ARCHIVE_HOUSES.forEach((house, houseIndex) => {
  const collection = COLLECTIONS[house.collection];
  const letter = String.fromCharCode(65 + houseIndex);
  let serial = 0;
  const addDropItem = (slot, spec, localIndex) => {
    const model = `${DROP3_MODELS[slot][localIndex]} ${letter}${serial + 1}Q`;
    EXTRA_ITEMS.push({
      collection: house.collection,
      slot,
      rarity: DROP3_RARITIES[serial],
      name: `${house.brand} ${model}`,
      variant: spec.variant,
      fit: spec.fit || null,
      shape: spec.shape || null,
      sole: spec.sole || null,
      soleType: spec.soleType || null,
      upper: spec.upper || null,
      watchFamily: spec.watchFamily || null,
      brand: house.brand,
      model,
      paletteIndex: (houseIndex * 7 + serial) % collection.palettes.length,
      style: 'АРХИВ'
    });
    serial += 1;
  };
  const tops = DROP3_TOP_SETS[house.collection] || DROP3_TOP_SETS.noir;
  const bottoms = DROP3_BOTTOM_SETS[house.collection] || DROP3_BOTTOM_SETS.noir;
  const shoes = DROP3_SHOE_SETS[house.collection] || DROP3_SHOE_SETS.noir;
  tops.forEach((spec, index) => addDropItem('top', spec, index));
  bottoms.forEach((spec, index) => addDropItem('bottom', spec, index));
  shoes.forEach((spec, index) => addDropItem('shoes', spec, index));
  [0, 1].forEach((offset) => {
    const spec = DROP3_ACCESSORY_BANK[(houseIndex * 3 + offset) % DROP3_ACCESSORY_BANK.length];
    addDropItem('accessory', spec, offset);
  });
});

/* ---------- DROP 04 · 10 houses × 20 = 200 + 3 grails = 1000 items ---------- */
const DROP4_MODELS = {
  top: ['Aeon', 'Blaze', 'Cipher', 'Dyno', 'Ethos', 'Fable', 'Glint', 'Hush', 'Ion', 'Jolt', 'Karma', 'Loom', 'Miro', 'Nimbus', 'Opal', 'Prism', 'Quark', 'Rift', 'Spark', 'Tidal'],
  bottom: ['Arc', 'Bloom', 'Chase', 'Dusk', 'Edge', 'Flow', 'Grain', 'Haze', 'Inlet', 'Jive', 'Kinetic', 'Loop'],
  shoes: ['Aero', 'Brisk', 'Climb', 'Dash', 'Echo', 'Fleet', 'Glide', 'Hype', 'Ice', 'Jump', 'Kick', 'Lace'],
  accessory: ['Aura', 'Beam', 'Crest', 'Dune', 'Ember', 'Frost', 'Gem', 'Halo', 'Iris', 'Jolt', 'Kite', 'Lumen']
};
const DROP4_TOP_SETS = {
  sport: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'tank', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'regular' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  street: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'tank', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'regular' },
    { variant: 'shirt', fit: 'regular' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  noir: [
    { variant: 'tee', fit: 'cropped' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  old: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  muse: [
    { variant: 'tee', fit: 'cropped' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ]
};
const DROP4_BOTTOM_SETS = {
  sport: [
    { variant: 'track', fit: 'mid' },
    { variant: 'baggy', fit: 'low' },
    { variant: 'parachute', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'wide', fit: 'mid' }
  ],
  street: [
    { variant: 'track', fit: 'mid' },
    { variant: 'baggy', fit: 'low' },
    { variant: 'parachute', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'jorts', fit: 'low' }
  ],
  noir: [
    { variant: 'tailored', fit: 'mid' },
    { variant: 'wide', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'jorts', fit: 'low' },
    { variant: 'parachute', fit: 'mid' }
  ],
  old: [
    { variant: 'tailored', fit: 'mid' },
    { variant: 'wide', fit: 'high' },
    { variant: 'flare', fit: 'high' },
    { variant: 'jorts', fit: 'low' },
    { variant: 'baggy', fit: 'low' }
  ],
  muse: [
    { variant: 'flare', fit: 'high' },
    { variant: 'wide', fit: 'high' },
    { variant: 'parachute', fit: 'mid' },
    { variant: 'jorts', fit: 'low' },
    { variant: 'baggy', fit: 'low' }
  ]
};
const DROP4_SHOE_SETS = {
  sport: [
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'mesh' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'nubuck' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'runner', sole: 'max', soleType: 'carbon', upper: 'knit' }
  ],
  street: [
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'canvas' },
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'knit' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'sneaker', sole: 'mid', soleType: 'cup', upper: 'nubuck' }
  ],
  noir: [
    { variant: 'derby', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'platform', sole: 'max', soleType: 'lug', upper: 'leather' },
    { variant: 'runner', sole: 'high', soleType: 'tread', upper: 'mesh' }
  ],
  old: [
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'derby', sole: 'mid', soleType: 'cup', upper: 'nubuck' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'leather' }
  ],
  muse: [
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'mule', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'suede' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'mesh' }
  ]
};
const DROP4_ACCESSORY_BANK = [
  { variant: 'visor' },
  { variant: 'glasses', shape: 'rect' },
  { variant: 'watch', watchFamily: 'chrono' },
  { variant: 'rings' },
  { variant: 'chain' },
  { variant: 'earrings' },
  { variant: 'pearls' },
  { variant: 'glasses', shape: 'cat' },
  { variant: 'watch', watchFamily: 'gmt' },
  { variant: 'watch', watchFamily: 'dress' }
];
const DROP4_RARITIES = ['base', 'norm', 'norm', 'trend', 'trend', 'couture', 'legend', 'base', 'norm', 'trend', 'couture', 'legend', 'base', 'norm', 'trend', 'couture', 'legend', 'icon', 'base', 'trend'];
ARCHIVE_HOUSES.forEach((house, houseIndex) => {
  const collection = COLLECTIONS[house.collection];
  const letter = String.fromCharCode(65 + houseIndex);
  let serial = 0;
  const addDropItem = (slot, spec, localIndex) => {
    const model = `${DROP4_MODELS[slot][localIndex]} ${letter}${serial + 1}Z`;
    EXTRA_ITEMS.push({
      collection: house.collection,
      slot,
      rarity: DROP4_RARITIES[serial],
      name: `${house.brand} ${model}`,
      variant: spec.variant,
      fit: spec.fit || null,
      shape: spec.shape || null,
      sole: spec.sole || null,
      soleType: spec.soleType || null,
      upper: spec.upper || null,
      watchFamily: spec.watchFamily || null,
      brand: house.brand,
      model,
      paletteIndex: (houseIndex * 11 + serial) % collection.palettes.length,
      style: 'АРХИВ'
    });
    serial += 1;
  };
  const tops = DROP4_TOP_SETS[house.collection] || DROP4_TOP_SETS.noir;
  const bottoms = DROP4_BOTTOM_SETS[house.collection] || DROP4_BOTTOM_SETS.noir;
  const shoes = DROP4_SHOE_SETS[house.collection] || DROP4_SHOE_SETS.noir;
  tops.forEach((spec, index) => addDropItem('top', spec, index));
  bottoms.forEach((spec, index) => addDropItem('bottom', spec, index));
  shoes.forEach((spec, index) => addDropItem('shoes', spec, index));
  [0, 1, 2, 3].forEach((offset) => {
    const spec = DROP4_ACCESSORY_BANK[(houseIndex * 4 + offset) % DROP4_ACCESSORY_BANK.length];
    addDropItem('accessory', spec, offset);
  });
});
[
  { collection: 'sport', name: 'HORLOGE Singularis', brand: 'HORLOGE', model: 'Singularis', watchFamily: 'dress', paletteIndex: 2 },
  { collection: 'old', name: 'AUREL Eclipse', brand: 'AUREL', model: 'Eclipse', watchFamily: 'dress', paletteIndex: 4 },
  { collection: 'sport', name: 'VÉLOCE Chronomax', brand: 'VÉLOCE', model: 'Chronomax', watchFamily: 'chrono', paletteIndex: 5 }
].forEach((entry) => {
  EXTRA_ITEMS.push({
    collection: entry.collection,
    slot: 'accessory',
    rarity: 'icon',
    name: entry.name,
    variant: 'watch',
    brand: entry.brand,
    model: entry.model,
    watchFamily: entry.watchFamily,
    paletteIndex: entry.paletteIndex,
    style: 'АРХИВ'
  });
});

/* ---------- DROP 05 · 10 houses × 25 = 250 more branded items ---------- */
const DROP5_MODELS = {
  top: ['Aster', 'Beacon', 'Comet', 'Delta', 'Echo', 'Fable', 'Glyph', 'Halo', 'Iris', 'Juno', 'Kite', 'Loom', 'Mirage', 'Nimbus', 'Orbit', 'Pulse', 'Quartz', 'Rune', 'Solace', 'Tide', 'Umbra', 'Verse', 'Wave', 'Xenon', 'Zenith'],
  bottom: ['Base', 'Curve', 'Drift', 'Edge', 'Fold', 'Grain', 'Hinge', 'Inlet', 'Jolt', 'Knot', 'Lane', 'Mesh', 'Notch', 'Pace', 'Ridge'],
  shoes: ['Arrow', 'Brisk', 'Climb', 'Dart', 'Echo', 'Fleet', 'Glide', 'Hype', 'Ion', 'Jump', 'Kick', 'Lace', 'Move', 'Nudge', 'Orbit'],
  accessory: ['Aura', 'Beam', 'Crest', 'Dune', 'Ember', 'Frost', 'Gem', 'Halo', 'Iris', 'Jolt', 'Kite', 'Lumen', 'Mark', 'Niche', 'Opal']
};
const DROP5_TOP_SETS = {
  sport: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'tank', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'regular' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  street: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'tank', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'regular' },
    { variant: 'shirt', fit: 'regular' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' }
  ],
  noir: [
    { variant: 'tee', fit: 'cropped' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' },
    { variant: 'tank', fit: 'regular' }
  ],
  old: [
    { variant: 'tee', fit: 'regular' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' },
    { variant: 'tank', fit: 'regular' }
  ],
  muse: [
    { variant: 'tee', fit: 'cropped' },
    { variant: 'longsleeve', fit: 'slim' },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'vest', fit: 'tailored' },
    { variant: 'bomber', fit: 'oversize' },
    { variant: 'hoodie', fit: 'oversize' },
    { variant: 'tank', fit: 'regular' }
  ]
};
const DROP5_BOTTOM_SETS = {
  sport: [
    { variant: 'track', fit: 'mid' },
    { variant: 'baggy', fit: 'low' },
    { variant: 'parachute', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'wide', fit: 'mid' },
    { variant: 'jorts', fit: 'low' }
  ],
  street: [
    { variant: 'track', fit: 'mid' },
    { variant: 'baggy', fit: 'low' },
    { variant: 'parachute', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'wide', fit: 'mid' },
    { variant: 'jorts', fit: 'low' }
  ],
  noir: [
    { variant: 'tailored', fit: 'mid' },
    { variant: 'wide', fit: 'mid' },
    { variant: 'flare', fit: 'high' },
    { variant: 'jorts', fit: 'low' },
    { variant: 'parachute', fit: 'mid' },
    { variant: 'baggy', fit: 'low' }
  ],
  old: [
    { variant: 'tailored', fit: 'mid' },
    { variant: 'wide', fit: 'high' },
    { variant: 'flare', fit: 'high' },
    { variant: 'jorts', fit: 'low' },
    { variant: 'baggy', fit: 'low' },
    { variant: 'parachute', fit: 'mid' }
  ],
  muse: [
    { variant: 'flare', fit: 'high' },
    { variant: 'wide', fit: 'high' },
    { variant: 'parachute', fit: 'mid' },
    { variant: 'jorts', fit: 'low' },
    { variant: 'baggy', fit: 'low' },
    { variant: 'tailored', fit: 'mid' }
  ]
};
const DROP5_SHOE_SETS = {
  sport: [
    { variant: 'runner', sole: 'high', soleType: 'tread', upper: 'knit' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'nubuck' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'runner', sole: 'max', soleType: 'carbon', upper: 'mesh' },
    { variant: 'sneaker', sole: 'mid', soleType: 'cup', upper: 'leather' }
  ],
  street: [
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'canvas' },
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'knit' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'sneaker', sole: 'mid', soleType: 'cup', upper: 'nubuck' },
    { variant: 'runner', sole: 'high', soleType: 'tread', upper: 'mesh' }
  ],
  noir: [
    { variant: 'derby', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'platform', sole: 'max', soleType: 'lug', upper: 'leather' },
    { variant: 'runner', sole: 'high', soleType: 'tread', upper: 'mesh' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'leather' }
  ],
  old: [
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'derby', sole: 'mid', soleType: 'cup', upper: 'nubuck' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'derby', sole: 'low', soleType: 'cup', upper: 'suede' }
  ],
  muse: [
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'mule', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'suede' },
    { variant: 'platform', sole: 'high', soleType: 'lug', upper: 'leather' },
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'mesh' },
    { variant: 'ballet', sole: 'mid', soleType: 'cup', upper: 'satin' }
  ]
};
const DROP5_ACCESSORY_BANK = [
  { variant: 'visor' },
  { variant: 'glasses', shape: 'rect' },
  { variant: 'watch', watchFamily: 'chrono' },
  { variant: 'rings' },
  { variant: 'chain' },
  { variant: 'earrings' },
  { variant: 'pearls' },
  { variant: 'glasses', shape: 'cat' },
  { variant: 'watch', watchFamily: 'gmt' },
  { variant: 'watch', watchFamily: 'dress' },
  { variant: 'glasses', shape: 'round' },
  { variant: 'watch', watchFamily: 'field' }
];
const DROP5_RARITIES = ['base', 'norm', 'norm', 'trend', 'trend', 'couture', 'couture', 'legend', 'base', 'norm', 'trend', 'trend', 'couture', 'legend', 'base', 'norm', 'trend', 'couture', 'legend', 'icon', 'base', 'norm', 'trend', 'couture', 'legend'];
ARCHIVE_HOUSES.forEach((house, houseIndex) => {
  const collection = COLLECTIONS[house.collection];
  const letter = String.fromCharCode(65 + houseIndex);
  let serial = 0;
  const addDropItem = (slot, spec, localIndex) => {
    const model = `${DROP5_MODELS[slot][localIndex]} ${letter}${serial + 1}X`;
    EXTRA_ITEMS.push({
      collection: house.collection,
      slot,
      rarity: DROP5_RARITIES[serial],
      name: `${house.brand} ${model}`,
      variant: spec.variant,
      fit: spec.fit || null,
      shape: spec.shape || null,
      sole: spec.sole || null,
      soleType: spec.soleType || null,
      upper: spec.upper || null,
      watchFamily: spec.watchFamily || null,
      brand: house.brand,
      model,
      paletteIndex: (houseIndex * 13 + serial) % collection.palettes.length,
      style: 'АРХИВ'
    });
    serial += 1;
  };
  const tops = DROP5_TOP_SETS[house.collection] || DROP5_TOP_SETS.noir;
  const bottoms = DROP5_BOTTOM_SETS[house.collection] || DROP5_BOTTOM_SETS.noir;
  const shoes = DROP5_SHOE_SETS[house.collection] || DROP5_SHOE_SETS.noir;
  tops.forEach((spec, index) => addDropItem('top', spec, index));
  bottoms.forEach((spec, index) => addDropItem('bottom', spec, index));
  shoes.forEach((spec, index) => addDropItem('shoes', spec, index));
  [0, 1, 2, 3, 4, 5].forEach((offset) => {
    const spec = DROP5_ACCESSORY_BANK[(houseIndex * 5 + offset) % DROP5_ACCESSORY_BANK.length];
    addDropItem('accessory', spec, offset);
  });
});

/* ---------- DROP 06 · RUS 2026 · 10 houses × 25 = 250 ---------- */
const DROP6_MODELS = {
  top: ['Пуховик', 'Водолазка', 'Зип-худи', 'Кардиган', 'Фланель', 'Лонгслив', 'Жилет'],
  bottom: ['Джинсы-клёш', 'Буткат', 'Карго', 'Леггинсы', 'Капри', 'Парашют'],
  shoes: ['Угги', 'Лоферы', 'Кроссовки', 'Ботинки', 'Балетки', 'Раннеры'],
  accessory: ['Бини', 'Шарф', 'Сумка', 'Часы', 'Кольца', 'Очки']
};
const DROP6_TOP_SETS = {
  noir: [
    { variant: 'bomber', fit: 'oversize', puffer: true },
    { variant: 'longsleeve', fit: 'slim', turtleneck: true },
    { variant: 'hoodie', fit: 'oversize', zip: true },
    { variant: 'shirt', fit: 'regular', cardigan: true },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'regular' },
    { variant: 'vest', fit: 'tailored' }
  ],
  old: [
    { variant: 'bomber', fit: 'oversize', puffer: true },
    { variant: 'longsleeve', fit: 'slim', turtleneck: true },
    { variant: 'hoodie', fit: 'oversize', zip: true },
    { variant: 'shirt', fit: 'regular', cardigan: true },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'regular' },
    { variant: 'vest', fit: 'tailored' }
  ],
  street: [
    { variant: 'bomber', fit: 'oversize', puffer: true },
    { variant: 'longsleeve', fit: 'slim', turtleneck: true },
    { variant: 'hoodie', fit: 'oversize', zip: true },
    { variant: 'shirt', fit: 'regular', cardigan: true },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'regular' },
    { variant: 'vest', fit: 'tailored' }
  ],
  muse: [
    { variant: 'bomber', fit: 'oversize', puffer: true },
    { variant: 'longsleeve', fit: 'slim', turtleneck: true },
    { variant: 'hoodie', fit: 'oversize', zip: true },
    { variant: 'shirt', fit: 'regular', cardigan: true },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'regular' },
    { variant: 'vest', fit: 'tailored' }
  ],
  sport: [
    { variant: 'bomber', fit: 'oversize', puffer: true },
    { variant: 'longsleeve', fit: 'slim', turtleneck: true },
    { variant: 'hoodie', fit: 'oversize', zip: true },
    { variant: 'shirt', fit: 'regular', cardigan: true },
    { variant: 'shirt', fit: 'oversize' },
    { variant: 'longsleeve', fit: 'regular' },
    { variant: 'vest', fit: 'tailored' }
  ]
};
const DROP6_BOTTOM_SETS = {
  noir: [
    { variant: 'flare', fit: 'low', cut: 'flare' },
    { variant: 'flare', fit: 'mid', cut: 'bootcut', bootcut: true },
    { variant: 'baggy', fit: 'mid', cut: 'cargo', cargo: true },
    { variant: 'track', fit: 'mid', cut: 'leggings', leggings: true },
    { variant: 'jorts', fit: 'low', cut: 'capri', capri: true },
    { variant: 'parachute', fit: 'mid', cut: 'parachute' }
  ],
  old: [
    { variant: 'flare', fit: 'low', cut: 'flare' },
    { variant: 'flare', fit: 'mid', cut: 'bootcut', bootcut: true },
    { variant: 'baggy', fit: 'mid', cut: 'cargo', cargo: true },
    { variant: 'track', fit: 'mid', cut: 'leggings', leggings: true },
    { variant: 'jorts', fit: 'low', cut: 'capri', capri: true },
    { variant: 'parachute', fit: 'mid', cut: 'parachute' }
  ],
  street: [
    { variant: 'flare', fit: 'low', cut: 'flare' },
    { variant: 'flare', fit: 'mid', cut: 'bootcut', bootcut: true },
    { variant: 'baggy', fit: 'mid', cut: 'cargo', cargo: true },
    { variant: 'track', fit: 'mid', cut: 'leggings', leggings: true },
    { variant: 'jorts', fit: 'low', cut: 'capri', capri: true },
    { variant: 'parachute', fit: 'mid', cut: 'parachute' }
  ],
  muse: [
    { variant: 'flare', fit: 'low', cut: 'flare' },
    { variant: 'flare', fit: 'mid', cut: 'bootcut', bootcut: true },
    { variant: 'baggy', fit: 'mid', cut: 'cargo', cargo: true },
    { variant: 'track', fit: 'mid', cut: 'leggings', leggings: true },
    { variant: 'jorts', fit: 'low', cut: 'capri', capri: true },
    { variant: 'parachute', fit: 'mid', cut: 'parachute' }
  ],
  sport: [
    { variant: 'flare', fit: 'low', cut: 'flare' },
    { variant: 'flare', fit: 'mid', cut: 'bootcut', bootcut: true },
    { variant: 'baggy', fit: 'mid', cut: 'cargo', cargo: true },
    { variant: 'track', fit: 'mid', cut: 'leggings', leggings: true },
    { variant: 'jorts', fit: 'low', cut: 'capri', capri: true },
    { variant: 'parachute', fit: 'mid', cut: 'parachute' }
  ]
};
const DROP6_SHOE_SETS = {
  noir: [
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede', uggs: true },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'boot', sole: 'mid', soleType: 'lug', upper: 'leather' },
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'mesh' }
  ],
  old: [
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede', uggs: true },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'suede' },
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'mesh' }
  ],
  street: [
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede', uggs: true },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'canvas' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'nubuck' },
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'runner', sole: 'high', soleType: 'tread', upper: 'mesh' }
  ],
  muse: [
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede', uggs: true },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'suede' },
    { variant: 'boot', sole: 'mid', soleType: 'cup', upper: 'leather' },
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'runner', sole: 'mid', soleType: 'foam', upper: 'knit' }
  ],
  sport: [
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'suede', uggs: true },
    { variant: 'loafer', sole: 'low', soleType: 'cup', upper: 'leather' },
    { variant: 'sneaker', sole: 'low', soleType: 'cup', upper: 'mesh' },
    { variant: 'boot', sole: 'high', soleType: 'lug', upper: 'nubuck' },
    { variant: 'ballet', sole: 'low', soleType: 'cup', upper: 'satin' },
    { variant: 'runner', sole: 'max', soleType: 'carbon', upper: 'mesh' }
  ]
};
const DROP6_ACCESSORY_BANK = [
  { variant: 'beanie' },
  { variant: 'scarf' },
  { variant: 'bag' },
  { variant: 'watch', watchFamily: 'chrono' },
  { variant: 'rings' },
  { variant: 'glasses', shape: 'round' }
];
const DROP6_RARITIES = ['base', 'norm', 'norm', 'trend', 'trend', 'couture', 'couture', 'legend', 'base', 'norm', 'trend', 'trend', 'couture', 'legend', 'base', 'norm', 'trend', 'couture', 'legend', 'icon', 'base', 'norm', 'trend', 'couture', 'legend'];
const DROP6_STYLES = {
  top: ['ЗИМА 2026', 'ДЕМИСЕЗОН 2026', 'СТРИТ 2026', 'ДЕМИСЕЗОН 2026', 'ДЕНИМ 2026', 'БАЗА 2026', 'ДЕМИСЕЗОН 2026'],
  bottom: ['ДЕНИМ 2026', 'ДЕНИМ 2026', 'УТИЛИТИ 2026', 'СПОРТ 2026', 'ДЕНИМ 2026', 'УЛИЦА 2026'],
  shoes: ['ЗИМА 2026', 'ДЕМИСЕЗОН 2026', 'СПОРТ 2026', 'ЗИМА 2026', 'ДЕМИСЕЗОН 2026', 'СПОРТ 2026'],
  accessory: ['ЗИМА 2026', 'ЗИМА 2026', 'УТИЛИТИ 2026', 'АКСЕССУАР', 'АКСЕССУАР', 'АКСЕССУАР']
};
ARCHIVE_HOUSES.forEach((house, houseIndex) => {
  const collection = COLLECTIONS[house.collection];
  const letter = String.fromCharCode(65 + houseIndex);
  let serial = 0;
  const addDrop6Item = (slot, spec, localIndex) => {
    const model = `${DROP6_MODELS[slot][localIndex]} ${letter}${serial + 1}R26`;
    EXTRA_ITEMS.push({
      collection: house.collection,
      slot,
      rarity: DROP6_RARITIES[serial],
      name: `${house.brand} ${model}`,
      variant: spec.variant,
      fit: spec.fit || null,
      cut: spec.cut || null,
      shape: spec.shape || null,
      sole: spec.sole || null,
      soleType: spec.soleType || null,
      upper: spec.upper || null,
      watchFamily: spec.watchFamily || null,
      puffer: Boolean(spec.puffer),
      turtleneck: Boolean(spec.turtleneck),
      cardigan: Boolean(spec.cardigan),
      bootcut: Boolean(spec.bootcut),
      leggings: Boolean(spec.leggings),
      capri: Boolean(spec.capri),
      cargo: Boolean(spec.cargo),
      uggs: Boolean(spec.uggs),
      brand: house.brand,
      model,
      paletteIndex: (houseIndex * 17 + serial) % collection.palettes.length,
      style: DROP6_STYLES[slot][localIndex]
    });
    serial += 1;
  };
  const tops = DROP6_TOP_SETS[house.collection] || DROP6_TOP_SETS.noir;
  const bottoms = DROP6_BOTTOM_SETS[house.collection] || DROP6_BOTTOM_SETS.noir;
  const shoes = DROP6_SHOE_SETS[house.collection] || DROP6_SHOE_SETS.noir;
  tops.forEach((spec, index) => addDrop6Item('top', spec, index));
  bottoms.forEach((spec, index) => addDrop6Item('bottom', spec, index));
  shoes.forEach((spec, index) => addDrop6Item('shoes', spec, index));
  [0, 1, 2, 3, 4, 5].forEach((offset) => {
    const spec = DROP6_ACCESSORY_BANK[offset];
    addDrop6Item('accessory', spec, offset);
  });
});


const CAPSULE_SKIRTS = [
  { collection: 'street', rarity: 'trend', name: 'Джинсовая мини', variant: 'skirt', paletteIndex: 1, fit: 'high', length: 'mini', style: 'СТРИТ' },
  { collection: 'muse', rarity: 'trend', name: 'Деним-миди', variant: 'skirt', paletteIndex: 1, fit: 'high', length: 'midi', style: 'СТУДИЯ' }
];
const CAPSULE_HAIR = [
  { collection: 'noir', rarity: 'norm', name: 'Длина', variant: 'long', paletteIndex: 1, style: 'МИНИМАЛ' },
  { collection: 'old', rarity: 'norm', name: 'Прямое каре', variant: 'lob', paletteIndex: 1, style: 'ОЛД-МАНИ' },
  { collection: 'street', rarity: 'norm', name: 'Базз', variant: 'buzz', paletteIndex: 1, style: 'СТРИТ' },
  { collection: 'muse', rarity: 'trend', name: 'Волны', variant: 'waves', paletteIndex: 2, style: 'СТУДИЯ' },
  { collection: 'sport', rarity: 'trend', name: 'Мягкое каре', variant: 'lob', paletteIndex: 2, style: 'СПОРТ' }
];
const CAPSULE_BELTS = [
  { collection: 'noir', rarity: 'base', name: 'Ремень Ноль', paletteIndex: 0, beltMaterial: 'leather', brand: 'NOCTURNE' },
  { collection: 'noir', rarity: 'norm', name: 'Ремень Контур', paletteIndex: 1, beltMaterial: 'leather', brand: 'SÈVE' },
  { collection: 'noir', rarity: 'norm', name: 'Ремень Графит', paletteIndex: 2, beltMaterial: 'suede', brand: 'NOCTURNE' },
  { collection: 'noir', rarity: 'trend', name: 'Ремень Сталь', paletteIndex: 3, beltMaterial: 'chain', brand: 'SÈVE' },
  { collection: 'noir', rarity: 'couture', name: 'Ремень Архив', paletteIndex: 4, beltMaterial: 'patent', brand: 'NOCTURNE' },
  { collection: 'noir', rarity: 'legend', name: 'Ремень Полночь', paletteIndex: 5, beltMaterial: 'leather', brand: 'SÈVE' },
  { collection: 'old', rarity: 'base', name: 'Ремень Камея', paletteIndex: 0, beltMaterial: 'leather', brand: 'AUREL' },
  { collection: 'old', rarity: 'norm', name: 'Ремень Клуб', paletteIndex: 1, beltMaterial: 'suede', brand: 'SABLE' },
  { collection: 'old', rarity: 'norm', name: 'Ремень Наследие', paletteIndex: 2, beltMaterial: 'leather', brand: 'HORLOGE' },
  { collection: 'old', rarity: 'trend', name: 'Ремень Аукцион', paletteIndex: 3, beltMaterial: 'webbing', brand: 'SABLE' },
  { collection: 'old', rarity: 'couture', name: 'Ремень Печать', paletteIndex: 4, beltMaterial: 'patent', brand: 'AUREL' },
  { collection: 'old', rarity: 'legend', name: 'Ремень Герб', paletteIndex: 4, beltMaterial: 'chain', brand: 'HORLOGE' },
  { collection: 'street', rarity: 'base', name: 'Ремень Бетон', paletteIndex: 0, beltMaterial: 'webbing', brand: 'TERRAIN' },
  { collection: 'street', rarity: 'norm', name: 'Ремень Двор', paletteIndex: 1, beltMaterial: 'leather', brand: 'RIVE GAUCHE' },
  { collection: 'street', rarity: 'norm', name: 'Ремень Сигнал', paletteIndex: 2, beltMaterial: 'webbing', brand: 'STADION' },
  { collection: 'street', rarity: 'trend', name: 'Ремень Провод', paletteIndex: 3, beltMaterial: 'chain', brand: 'VÉLOCE' },
  { collection: 'street', rarity: 'couture', name: 'Ремень Трафик', paletteIndex: 3, beltMaterial: 'leather', brand: 'RIVE GAUCHE' },
  { collection: 'street', rarity: 'couture', name: 'Ремень Табло', paletteIndex: 0, beltMaterial: 'patent', brand: 'STADION' },
  { collection: 'muse', rarity: 'base', name: 'Ремень Пудра', paletteIndex: 0, beltMaterial: 'suede', brand: 'CAELUM' },
  { collection: 'muse', rarity: 'norm', name: 'Ремень Бордо', paletteIndex: 1, beltMaterial: 'leather', brand: 'AUREL' },
  { collection: 'muse', rarity: 'norm', name: 'Ремень Жемчуг', paletteIndex: 2, beltMaterial: 'patent', brand: 'SABLE' },
  { collection: 'muse', rarity: 'trend', name: 'Ремень Тон', paletteIndex: 3, beltMaterial: 'leather', brand: 'CAELUM' },
  { collection: 'muse', rarity: 'couture', name: 'Ремень Опера', paletteIndex: 4, beltMaterial: 'chain', brand: 'SABLE' },
  { collection: 'muse', rarity: 'legend', name: 'Ремень Атлас', paletteIndex: 4, beltMaterial: 'patent', brand: 'AUREL' },
  { collection: 'sport', rarity: 'base', name: 'Ремень Трибуна', paletteIndex: 0, beltMaterial: 'webbing', brand: 'STADION' },
  { collection: 'sport', rarity: 'norm', name: 'Ремень Темп', paletteIndex: 1, beltMaterial: 'webbing', brand: 'VÉLOCE' },
  { collection: 'sport', rarity: 'norm', name: 'Ремень Старт', paletteIndex: 2, beltMaterial: 'leather', brand: 'TERRAIN' },
  { collection: 'sport', rarity: 'trend', name: 'Ремень Дорожка', paletteIndex: 3, beltMaterial: 'webbing', brand: 'STADION' },
  { collection: 'sport', rarity: 'couture', name: 'Ремень Финиш', paletteIndex: 4, beltMaterial: 'chain', brand: 'VÉLOCE' },
  { collection: 'sport', rarity: 'icon', name: 'Ремень Рекорд', paletteIndex: 5, beltMaterial: 'leather', brand: 'TERRAIN' }
];
CAPSULE_SKIRTS.forEach((entry) => {
  EXTRA_ITEMS.push({ ...entry, slot: 'bottom' });
});
CAPSULE_HAIR.forEach((entry) => {
  EXTRA_ITEMS.push({ ...entry, slot: 'hair' });
});
CAPSULE_BELTS.forEach((entry) => {
  EXTRA_ITEMS.push({ ...entry, slot: 'accessory', variant: 'belt' });
});

const extraVariantCounts = {};
EXTRA_ITEMS.forEach((entry) => {
  const key = `${entry.collection}-${entry.slot}-${entry.variant}`;
  extraVariantCounts[key] = (extraVariantCounts[key] || 0) + 1;
  const rarity = RARITY_META[entry.rarity];
  const collection = COLLECTIONS[entry.collection];
  ITEMS.push({
    id: `${entry.collection}-${entry.slot}-extra-${entry.variant}-${extraVariantCounts[key]}`,
    collection: entry.collection,
    slot: entry.slot,
    rarity: entry.rarity,
    name: entry.name,
    variant: entry.variant,
    fit: entry.fit || null,
    cut: entry.cut || null,
    length: entry.length || null,
    cargo: Boolean(entry.cargo),
    zip: Boolean(entry.zip),
    puffer: Boolean(entry.puffer),
    turtleneck: Boolean(entry.turtleneck),
    cardigan: Boolean(entry.cardigan),
    bootcut: Boolean(entry.bootcut),
    leggings: Boolean(entry.leggings),
    capri: Boolean(entry.capri),
    cargo: Boolean(entry.cargo),
    uggs: Boolean(entry.uggs),
    shape: entry.shape || null,
    style: entry.style || '',
    brand: entry.brand || null,
    mark: entry.mark || null,
    model: entry.model || null,
    sole: entry.sole || null,
    upper: entry.upper || null,
    soleType: entry.soleType || null,
    watchFamily: entry.watchFamily || null,
    beltMaterial: entry.beltMaterial || null,
    palette: collection.palettes[entry.paletteIndex] || collection.palettes[0],
    points: rarity.points,
    sell: rarity.sell,
    index: ITEMS.length + 1
  });
});

ITEMS.forEach(finalizeItem);

for (let index = ITEMS.length - 1; index >= 0; index -= 1) {
  if (ITEMS[index].invalidCatalog) ITEMS.splice(index, 1);
}
const catalogIds = new Set();
ITEMS.forEach((item, index) => {
  const base = item.id;
  let id = base;
  let suffix = 2;
  while (catalogIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  item.id = id;
  item.index = index + 1;
  catalogIds.add(id);
});

const displayNameCounts = {};
ITEMS.forEach((item) => {
  const base = item.brand && !item.name.startsWith(item.brand) ? `${item.brand} ${item.name}` : item.name;
  displayNameCounts[base] = (displayNameCounts[base] || 0) + 1;
});
const usedDisplayNames = new Set();
ITEMS.forEach((item) => {
  const base = item.brand && !item.name.startsWith(item.brand) ? `${item.brand} ${item.name}` : item.name;
  let label = base;
  if (displayNameCounts[base] > 1) {
    const suffix = item.slot === 'hair'
      ? `${HAIR_LENGTH_LABELS[item.hairLength] || 'СТРИЖКА'} · ${COLLECTIONS[item.collection].name}`
      : SLOT_BY_ID[item.slot].label.toUpperCase();
    label = `${base} · ${suffix}`;
    let counter = 2;
    while (usedDisplayNames.has(label)) {
      label = `${base} · ${suffix} ${counter}`;
      counter += 1;
    }
  }
  usedDisplayNames.add(label);
  item.labelName = label;
});

ITEMS.forEach((item) => {
  Object.freeze(item.palette);
  Object.freeze(item);
});
Object.freeze(ITEMS);
deepFreeze(COLLECTIONS);
deepFreeze(RARITIES);
deepFreeze(RARITY_META);
deepFreeze(CAPSULE_BRANDS);
deepFreeze(WATCH_DIALS);
deepFreeze(WATCH_STRAPS);
deepFreeze(SLOTS);
deepFreeze(SLOT_BY_ID);
deepFreeze(LEADERBOARDS);

const ITEM_BY_ID = Object.fromEntries(ITEMS.map((item) => [item.id, item]));

function buildCatalogCoverage() {
  const table = {};
  const missing = [];
  SLOTS.forEach((slot) => {
    table[slot.id] = {};
    Object.keys(DROP_TABLE).forEach((rarity) => {
      const count = ITEMS.filter((item) => item.slot === slot.id && item.rarity === rarity).length;
      table[slot.id][rarity] = count;
      if (!count) missing.push(`${slot.id}/${rarity}`);
    });
  });
  return { table, missing };
}

const CATALOG_COVERAGE = buildCatalogCoverage();
if (CATALOG_COVERAGE.missing.length) {
  console.error('[LUKAP] catalog coverage gaps:', CATALOG_COVERAGE.missing);
}
window.__lukapCoverage = CATALOG_COVERAGE;

function getItem(id) {
  return ownValue(ITEM_BY_ID, id);
}

function computeOutfit(equipped = state.equipped) {
  return window.LUKAP_OUTFIT.computeOutfit(equipped, {
    slotKeys: SLOT_KEYS,
    getItem,
    setBonus: SET_BONUS,
    collections: COLLECTIONS
  });
}

function createDefaultState() {
  const inventory = {};
  START_OWNED.forEach((id) => {
    inventory[id] = 1;
  });
  const state = {
    version: CURRENT_STATE_VERSION,
    wallet: 10000,
    inventory,
    equipped: { ...DEFAULT_EQUIPPED },
    selectedSlot: 'accessory',
    skin: 0,
    body: 'average',
    hairTexture: 'curly',
    watchDial: 'classic',
    watchStrap: 'leather',
    sound: true,
    bestScore: 0,
    sold: 0,
    history: [],
    dailyClaimed: false,
    dailyDate: todayKey(),
    wardrobeSlot: 'all',
    wardrobeCollection: 'all',
    wardrobeHairLength: 'all',
    leaderPeriod: 'week'
  };
  state.bestScore = computeOutfit(state.equipped).score;
  return state;
}

function migrateState(saved) {
  return window.LUKAP_STATE.migrateState(saved, CURRENT_STATE_VERSION, clampInt);
}

function loadState() {
  const defaults = createDefaultState();
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return defaults;
  }
  if (!raw) return defaults;
  if (raw.length > 1_000_000) {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return defaults;
  }
  let saved = null;
  try {
    saved = JSON.parse(raw);
  } catch {
    return defaults;
  }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaults;
  saved = migrateState(saved);

  const state = { ...defaults };
  state.version = CURRENT_STATE_VERSION;
  state.wallet = clampInt(saved.wallet, 0, 1_000_000_000, defaults.wallet);
  state.bestScore = clampInt(saved.bestScore, 0, 100, defaults.bestScore);
  state.sold = clampInt(saved.sold, 0, 10_000_000, 0);
  state.sound = typeof saved.sound === 'boolean' ? saved.sound : defaults.sound;
  state.dailyClaimed = saved.dailyClaimed === true;
  state.dailyDate = typeof saved.dailyDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.dailyDate) ? saved.dailyDate : defaults.dailyDate;

  state.inventory = {};
  if (saved.inventory && typeof saved.inventory === 'object' && !Array.isArray(saved.inventory)) {
    Object.entries(saved.inventory).slice(0, 2000).forEach(([id, quantity]) => {
      if (!getItem(id)) return;
      const count = clampInt(quantity, 0, 999, 0);
      if (count > 0) state.inventory[id] = count;
    });
  } else {
    state.inventory = { ...defaults.inventory };
  }

  state.equipped = { ...defaults.equipped };
  if (saved.equipped && typeof saved.equipped === 'object' && !Array.isArray(saved.equipped)) {
    SLOT_KEYS.forEach((slot) => {
      const id = saved.equipped[slot];
      if (id === null) {
        state.equipped[slot] = null;
        return;
      }
      const item = typeof id === 'string' ? getItem(id) : null;
      if (item && item.slot === slot) state.equipped[slot] = item.id;
    });
  }
  SLOT_KEYS.forEach((slot) => {
    if (state.equipped[slot] && !state.inventory[state.equipped[slot]]) {
      state.equipped[slot] = state.inventory[defaults.equipped[slot]] ? defaults.equipped[slot] : null;
    }
  });

  state.selectedSlot = ownValue(SLOT_BY_ID, saved.selectedSlot) ? saved.selectedSlot : defaults.selectedSlot;
  state.skin = Number.isInteger(saved.skin) && SKINS[saved.skin] ? saved.skin : 0;
  state.body = ['slim', 'average', 'strong'].includes(saved.body) ? saved.body : 'average';
  state.hairTexture = HAIR_TEXTURES.some((texture) => texture.id === saved.hairTexture) ? saved.hairTexture : 'straight';
  state.watchDial = WATCH_DIALS.some((dial) => dial.id === saved.watchDial) ? saved.watchDial : 'classic';
  state.watchStrap = WATCH_STRAPS.some((strap) => strap.id === saved.watchStrap) ? saved.watchStrap : 'leather';
  state.wardrobeSlot = ['all', ...SLOT_KEYS].includes(saved.wardrobeSlot) ? saved.wardrobeSlot : 'all';
  state.wardrobeCollection = ['all', ...Object.keys(COLLECTIONS)].includes(saved.wardrobeCollection) ? saved.wardrobeCollection : 'all';
  state.wardrobeHairLength = ['all', 'short', 'medium', 'long'].includes(saved.wardrobeHairLength) ? saved.wardrobeHairLength : 'all';
  state.leaderPeriod = ownValue(LEADERBOARDS, saved.leaderPeriod) ? saved.leaderPeriod : 'week';

  state.history = [];
  if (Array.isArray(saved.history)) {
    saved.history.slice(0, 20).forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const item = typeof entry.id === 'string' ? getItem(entry.id) : null;
      if (!item) return;
      state.history.push({
        id: item.id,
        duplicate: entry.duplicate === true,
        at: Number.isFinite(entry.at) ? entry.at : Date.now()
      });
    });
  }

  const today = todayKey();
  if (state.dailyDate !== today) {
    state.dailyClaimed = false;
    state.dailyDate = today;
  }
  state.bestScore = Math.max(computeOutfit(state.equipped).score, state.bestScore);
  return state;
}

let state = loadState();
let activeTab = 'look';
let wardrobeLimit = 120;
let activeSheet = null;
let spinInProgress = false;
let spinTimer = null;
let spinTargetOffset = 0;
let pendingDrop = null;
let toastTimer = null;
let audioContext = null;
let lastLeaderboard = [];

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Demo storage can be unavailable in private mode.
  }
}

const avatarSvg = $('avatarSvg');
const avatarStage = $('avatarStage');
const reelTrack = $('reelTrack');
const dropModal = $('dropModal');
const backdrop = $('backdrop');

/* ---------- ECONOMY / STATE ---------- */

function updateBalance() {
  const value = formatCoins(state.wallet);
  $('balanceVal').textContent = value;
  $('sheetBalance').textContent = `Монеты ${value}`;
  $('topupBalance').textContent = value;
  $('walletProfile').textContent = value;
  renderBonus();
}

function renderBonus() {
  const button = $('bonusBtn');
  const label = $('bonusLabel');
  const sheetButton = $('bonusClaimSheet');
  if (button && label) {
    button.disabled = Boolean(state.dailyClaimed);
    label.textContent = state.dailyClaimed ? 'ПОЛУЧЕНО' : 'ЗАБРАТЬ';
  }
  if (sheetButton) {
    sheetButton.disabled = Boolean(state.dailyClaimed);
    sheetButton.textContent = state.dailyClaimed ? 'ПОЛУЧЕНО' : 'ЗАБРАТЬ';
  }
}

function ownedUniqueCount() {
  return ITEMS.filter((item) => (state.inventory[item.id] || 0) > 0).length;
}

function ownedCount(item) {
  return state.inventory[item.id] || 0;
}

/* ---------- LOOK / AVATAR ---------- */

function applyAvatar() {
  const outfit = computeOutfit();
  const hair = getItem(state.equipped.hair);
  const top = getItem(state.equipped.top);
  const bottom = getItem(state.equipped.bottom);
  const shoes = getItem(state.equipped.shoes);
  const accessory = getItem(state.equipped.accessory);

  const skin = SKINS[state.skin] || SKINS[0];
  avatarSvg.style.setProperty('--skin', skin.skin);
  avatarSvg.style.setProperty('--skin-shadow', skin.shadow);

  const fallbackTop = { tee: 'hoodie', tank: 'hoodie', longsleeve: 'hoodie', shirt: 'blazer', bomber: 'hoodie', vest: 'blazer', zip: 'hoodie' };
  const fallbackBottom = { flare: 'wide', baggy: 'wide', parachute: 'cargo', track: 'tailored', skirt: 'wide', jorts: 'tailored' };
  const fallbackShoes = { platform: 'loafer', mule: 'loafer', ballet: 'loafer', runner: 'sneaker', derby: 'loafer' };
  const fallbackAcc = { rings: 'none', chain: 'gold', pearls: 'gold', earrings: 'none', watch: 'gold' };
  const fallbackHair = { long: 'flow', waves: 'flow', lob: 'bob', buzz: 'crop', shag: 'wolf' };
  avatarSvg.dataset.hair = hair ? (fallbackHair[hair.variant] || (['crop', 'flow', 'fade', 'curtain', 'bob', 'pixie', 'mullet', 'wolf'].includes(hair.variant) ? 'slick' : hair.variant)) : 'none';
  avatarSvg.dataset.top = top ? (fallbackTop[top.variant] || top.variant) : 'none';
  avatarSvg.dataset.bottom = bottom ? (fallbackBottom[bottom.variant] || bottom.variant) : 'none';
  avatarSvg.dataset.shoes = shoes ? (fallbackShoes[shoes.variant] || shoes.variant) : 'none';
  avatarSvg.dataset.acc = accessory ? (fallbackAcc[accessory.variant] || accessory.variant) : 'none';
  avatarSvg.dataset.body = state.body;
  avatarSvg.dataset.hairTexture = state.hairTexture;
  window.itemArtTexture = state.hairTexture;
  window.itemArtWatchDial = state.watchDial;
  window.itemArtWatchStrap = state.watchStrap;

  if (hair) {
    avatarSvg.style.setProperty('--hair-main', hair.palette.hair);
    avatarSvg.style.setProperty('--hair-hi', hair.palette.hairHi);
    avatarSvg.style.setProperty('--hair-shadow', shade(hair.palette.hair, -48));
  }
  if (top) {
    avatarSvg.style.setProperty('--top-main', top.palette.main);
    avatarSvg.style.setProperty('--top-hi', shade(top.palette.main, 34));
    avatarSvg.style.setProperty('--top-shadow', shade(top.palette.main, -55));
    avatarSvg.style.setProperty('--top-detail', top.palette.detail);
    avatarSvg.style.setProperty('--top-accent', top.palette.accent);
    avatarSvg.style.setProperty('--top-metal', top.palette.metal);
  }
  if (bottom) {
    avatarSvg.style.setProperty('--bottom-main', shade(bottom.palette.main, 10));
    avatarSvg.style.setProperty('--bottom-hi', shade(bottom.palette.main, 46));
    avatarSvg.style.setProperty('--bottom-shadow', shade(bottom.palette.main, -42));
  }
  if (shoes) {
    avatarSvg.style.setProperty('--shoe-main', shade(shoes.palette.main, -24));
    avatarSvg.style.setProperty('--shoe-accent', shoes.palette.metal);
  }
  if (accessory) {
    avatarSvg.style.setProperty('--acc-main', accessory.variant === 'belt' ? accessory.palette.main : accessory.palette.metal);
    avatarSvg.style.setProperty('--acc-metal', accessory.palette.metal);
    avatarSvg.style.setProperty('--acc-accent', accessory.palette.accent);
    avatarSvg.style.setProperty('--acc-detail', accessory.palette.detail);
  }

  avatarSvg.setAttribute('aria-label', `Аватар в образе ${outfit.collection ? outfit.collection.name : 'микс'}, гармония ${outfit.score} из 100`);
  if (window.lukap3d && typeof window.lukap3d.sync === 'function') window.lukap3d.sync();
}

function updateLook() {
  const outfit = computeOutfit();
  const hasSet = outfit.setCount >= 2;
  const emptySlot = SLOT_KEYS.find((slot) => !getItem(state.equipped[slot]));
  $('scoreValue').textContent = outfit.score;
  $('scoreStatus').textContent = outfit.score === 100
    ? 'ИДЕАЛЬНЫЙ ЛУК'
    : outfit.full
      ? 'СЕТ 5/5 · НУЖНЫ ИКОНЫ'
      : emptySlot
        ? 'НЕПОЛНЫЙ ЛУК'
        : outfit.score >= 90
          ? 'ВЫСОКАЯ ГАРМОНИЯ'
          : outfit.score >= 80
            ? 'СИЛЬНЫЙ ЛУК'
            : outfit.score >= 70
              ? 'ЕСТЬ ХАРАКТЕР'
              : 'СОБИРАЙ СЕТ';
  $('setCollection').textContent = hasSet ? outfit.collection.name : 'МИКС';
  $('setCount').textContent = hasSet ? `${outfit.setCount}/5` : '—';
  $('rarityPips').innerHTML = SLOT_KEYS.map((slot) => {
    const item = getItem(state.equipped[slot]);
    return `<span style="--pip-color:${pipColor(item && item.rarity)}"></span>`;
  }).join('');

  let hint = 'Собери пять вещей и один сет';
  if (outfit.full) {
    hint = outfit.score === 100 ? 'Идеальный сет собран' : 'Сет 5/5 · до 100 — пять икон';
  } else if (emptySlot) {
    hint = `Пусто: ${SLOT_BY_ID[emptySlot].label.toLowerCase()}`;
  } else if (outfit.collection) {
    const missing = SLOT_KEYS.find((slot) => getItem(state.equipped[slot]).collection !== outfit.setKey);
    hint = missing ? `До 100 — ${SLOT_BY_ID[missing].label.toLowerCase()} ${outfit.collection.name}` : 'Собери пять вещей';
  }
  $('setHint').textContent = hint;

  avatarStage.classList.toggle('is-perfect', outfit.score === 100);
  $('perfectBadge').setAttribute('aria-hidden', outfit.score === 100 ? 'false' : 'true');

  const selectedItem = getItem(state.equipped[state.selectedSlot]);
  $('plaqueSet').textContent = outfit.collection ? outfit.collection.name : 'МИКС';
  $('plaqueItem').textContent = selectedItem ? `${selectedItem.name.toUpperCase()} · ${RARITY_META[selectedItem.rarity].label.toUpperCase()}` : 'ПУСТО · БАЗОВЫЙ СЛОЙ';

  if (outfit.score > state.bestScore) {
    state.bestScore = outfit.score;
    saveState();
  }
  $('statBest').textContent = Math.max(state.bestScore, outfit.score);
  $('statOwned').textContent = ownedUniqueCount();
  $('statSets').textContent = outfit.full ? '1' : '0';
  applyAvatar();
}

function cloneAvatar(target) {
  if (!target) return;
  const clone = avatarSvg.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  clone.style.cssText = avatarSvg.style.cssText;
  target.replaceChildren(clone);
}

function renderAvatarPortrait(target) {
  if (!target) return;
  if (window.lukap3d && typeof window.lukap3d.snapshot === 'function') {
    const url = window.lukap3d.snapshot();
    if (url) {
      target.innerHTML = `<img class="avatar-snapshot" src="${url}" alt="Объёмный образ ЛУКАП">`;
      return;
    }
  }
  cloneAvatar(target);
}

function updateProfile() {
  const outfit = computeOutfit();
  const setLabel = outfit.setCount >= 2 ? `${outfit.collection.name} ${outfit.setCount}/5` : `${outfit.items.length}/5 ВЕЩЕЙ`;
  $('profileTitle').textContent = `${setLabel} · ${outfit.score}`;
  $('profilePips').innerHTML = SLOT_KEYS.map((slot) => {
    const item = getItem(state.equipped[slot]);
    return `<span style="--pip:${pipColor(item && item.rarity)}"></span>`;
  }).join('');
  $('statBest').textContent = Math.max(state.bestScore, outfit.score);
  $('statOwned').textContent = ownedUniqueCount();
  $('statSets').textContent = outfit.full ? '1' : '0';
  const self = getLeaderboard().find((player) => player.isSelf);
  $('profileRank').textContent = `#${self ? self.rank : 4}`;
  updateBalance();
  renderAvatarPortrait($('profilePortrait'));
}

/* ---------- SLOT RAIL ---------- */

function renderSlotRail() {
  const rail = $('slotRail');
  rail.innerHTML = SLOTS.map((slot) => {
    const item = getItem(state.equipped[slot.id]);
    const rarity = item ? RARITY_META[item.rarity] : null;
    const selected = state.selectedSlot === slot.id;
    return `
      <button class="slot-card ${selected ? 'is-selected' : ''} ${item ? '' : 'is-empty'}" data-slot="${slot.id}" data-rarity="${item ? item.rarity : 'none'}" style="--rarity-color:${rarity ? rarity.color : '#cbbfae'}" aria-pressed="${selected}" aria-label="${slot.label}: ${item ? `${escapeHTML(itemLabel(item))}, ${rarity.label}` : 'пусто'}">
        <span class="slot-top">
          <span class="slot-icon"><svg class="icon"><use href="#${slot.icon}"></use></svg></span>
          <span class="slot-spin-mark" data-spin-slot="${slot.id}" aria-hidden="true"><svg class="icon"><use href="#i-spark"></use></svg></span>
        </span>
        <span class="slot-label">${slot.short}</span>
        <span class="slot-name">${item ? escapeHTML(itemLabel(item)) : 'Пусто'}</span>
      </button>`;
  }).join('');
}

/* ---------- QUICK SLOT WARDROBE ---------- */

function openSlotSheet(slotId) {
  state.selectedSlot = ownValue(SLOT_BY_ID, slotId) ? slotId : 'accessory';
  saveState();
  closeSheets();
  closeDrop();
  renderSlotRail();
  updateSpinChrome();
  renderSlotSheet();
  openTray();
}

function openTray() {
  const tray = $('slotSheet');
  if (!tray) return;
  closeSheets();
  closeDrop();
  tray.classList.add('is-open');
  tray.setAttribute('aria-hidden', 'false');
  $('appFrame').classList.add('has-tray');
}

function closeTray() {
  const tray = $('slotSheet');
  if (!tray) return;
  tray.classList.remove('is-open');
  tray.setAttribute('aria-hidden', 'true');
  $('appFrame').classList.remove('has-tray');
}

function renderSlotSheet() {
  const slot = SLOT_BY_ID[state.selectedSlot];
  const equippedId = state.equipped[slot.id];
  const equipped = getItem(equippedId);
  const owned = ITEMS
    .filter((item) => item.slot === slot.id && ownedCount(item) > 0)
    .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || a.index - b.index);

  $('slotSheetTitle').textContent = slot.label.toUpperCase();
  const hairPanel = $('hairTexturePanel');
  if (hairPanel) hairPanel.hidden = slot.id !== 'hair';
  renderHairTextures();
  $('slotSheetCount').textContent = equipped
    ? `${itemLabel(equipped)} · ${COLLECTIONS[equipped.collection].name} · ${RARITY_META[equipped.rarity].label}`
    : 'Базовый слой · пусто';
  $('removeSlotBtn').disabled = !equippedId;
  $('removeSlotBtn').textContent = equippedId ? 'СНЯТЬ' : 'ПУСТО';
  $('slotSpinBtn').querySelector('span').textContent = `КРУТИТЬ · ${formatCoins(SPIN_COST)}`;

  $('slotOwnedGrid').innerHTML = owned.length
    ? owned.map((item) => {
      const rarity = RARITY_META[item.rarity];
      const collection = COLLECTIONS[item.collection];
      const active = equippedId === item.id;
      return `
        <button class="slot-item ${active ? 'is-active' : ''}" data-slot-item="${item.id}" data-rarity="${item.rarity}" style="--rarity-color:${rarity.color}">
          <span class="slot-item-art">${itemArt(item)}</span>
          <span class="slot-item-copy"><b>${escapeHTML(itemLabel(item))}</b><small>${escapeHTML(collection.name)} · ${rarity.label}</small></span>
          <span class="slot-item-state">${active ? 'НАДЕТО' : 'ПРИМЕРИТЬ'}</span>
        </button>`;
    }).join('')
    : `<div class="slot-empty-note">В этом слоте пока нет вещей. Первый прокрут добавит его в гардероб.</div>`;
}

function applyEquippedItem(item) {
  state.equipped[item.slot] = item.id;
  state.bestScore = Math.max(state.bestScore, computeOutfit().score);
  saveState();
  updateAll();
  renderSlotRail();
  if ($('slotSheet').classList.contains('is-open')) renderSlotSheet();
}

function removeSlotSoft(slotId) {
  if (!state.equipped[slotId]) return;
  const item = getItem(state.equipped[slotId]);
  state.equipped[slotId] = null;
  saveState();
  updateAll();
  renderSlotRail();
  if ($('slotSheet').classList.contains('is-open')) renderSlotSheet();
  showToast(item ? `${itemLabel(item)} снято` : 'Деталь снята');
}

function removeSlot(slotId) {
  if (!state.equipped[slotId]) return;
  removeSlotSoft(slotId);
  closeTray();
  closeSheets();
  switchTab('look');
  playTone(260, 0.06, 0.016, 'triangle');
}

/* ---------- SPIN SHEET ---------- */

function updateSpinChrome() {
  const slot = SLOT_BY_ID[state.selectedSlot];
  $('focusName').textContent = 'ВСЕ ВЕЩИ';
  $('selectedSlotLabel').textContent = slot.label.toUpperCase();
  $('spinCostLabel').textContent = formatCoins(SPIN_COST);
  $('spinSheetTitle').textContent = slot.label.toUpperCase();
  $('reelTier').textContent = `6 РЕДКОСТЕЙ · ${formatCoins(SPIN_COST)}`;
  $('sheetBalance').textContent = `Монеты ${formatCoins(state.wallet)}`;
  $('spinBtnLabel').textContent = spinInProgress ? 'КРУТИМ...' : `КРУТИТЬ · ${formatCoins(SPIN_COST)}`;
  $('spinBtn').disabled = spinInProgress;
  $('openSpinBtn').disabled = spinInProgress;
  $('skipBtn').hidden = !spinInProgress;
  $('openSpinBtn').querySelector('span').textContent = 'КРУТИТЬ';
  renderSpinOdds();
}

function randomItemForSlot(slotId, excludeId = null) {
  const pool = ITEMS.filter((item) => item.slot === slotId && item.id !== excludeId);
  return pool[Math.floor(randomUnit() * pool.length)] || ITEMS[0];
}

function reelCardHTML(item) {
  const rarity = RARITY_META[item.rarity];
  const collection = COLLECTIONS[item.collection];
  const slot = SLOT_BY_ID[item.slot];
  return `
    <div class="reel-card" style="--reel-color:${rarity.color};--rarity-color:${rarity.color}" data-rarity="${item.rarity}" data-item-id="${item.id}" aria-label="${escapeHTML(itemLabel(item))}, ${escapeHTML(collection.name)}, ${rarity.label}">
      <span class="reel-card-rarity">${rarity.label.toUpperCase()}</span>
      <span class="reel-card-photo">${itemArt(item)}</span>
      <span class="reel-card-name">${escapeHTML(itemLabel(item))}</span>
      <span class="reel-card-set">${collection.name}</span>
    </div>`;
}

function buildStaticReel() {
  const cards = [];
  for (let index = 0; index < 18; index += 1) {
    cards.push(reelCardHTML(randomItemForSlot(state.selectedSlot)));
  }
  reelTrack.style.transition = 'none';
  reelTrack.style.transform = 'translateX(0px)';
  reelTrack.innerHTML = cards.join('');
  document.querySelector('.reel-viewport')?.classList.remove('is-spinning');
}

function animateReel(resultItem) {
  const cards = [];
  const resultIndex = 18;
  for (let index = 0; index < 24; index += 1) {
    const item = index === resultIndex ? resultItem : randomItemForSlot(state.selectedSlot, resultItem.id);
    cards.push(reelCardHTML(item));
  }
  reelTrack.style.transition = 'none';
  reelTrack.style.transform = 'translateX(0px)';
  reelTrack.innerHTML = cards.join('');

  const resultCard = reelTrack.children[resultIndex];
  resultCard.dataset.result = 'true';
  const viewport = document.querySelector('.reel-viewport');
  viewport.classList.add('is-spinning');
  reelTrack.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const cardRect = resultCard.getBoundingClientRect();
  spinTargetOffset = (viewportRect.left + viewportRect.width / 2) - (cardRect.left + cardRect.width / 2);
  reelTrack.dataset.spinTarget = spinTargetOffset.toFixed(2);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      reelTrack.style.transition = 'transform 3200ms cubic-bezier(.12, .86, .08, 1)';
      reelTrack.style.transform = `translateX(${spinTargetOffset}px)`;
    });
  });
}

function rollRarity() {
  return window.LUKAP_OUTFIT.rollRarity(randomUnit, DROP_TABLE);
}

function openSpinSheet(slotId = state.selectedSlot) {
  if (spinInProgress) return;
  state.selectedSlot = ownValue(SLOT_BY_ID, slotId) ? slotId : 'accessory';
  saveState();
  renderSlotRail();
  updateSpinChrome();
  buildStaticReel();
  openSheet('spinSheet');
}

function performSpin() {
  if (spinInProgress) return;
  if (state.wallet < SPIN_COST) {
    showToast('Монеты закончились. Забери бонус дня.');
    openSheet('topupSheet');
    return;
  }

  const rarityId = rollRarity();
  const pool = ITEMS.filter((item) => item.slot === state.selectedSlot && item.rarity === rarityId);
  if (!pool.length) {
    console.error('[LUKAP] empty drop pool', { slot: state.selectedSlot, rarity: rarityId });
    showToast('Для этого слота пока нет вещей такой редкости');
    return;
  }
  state.wallet -= SPIN_COST;
  const item = pool[Math.floor(randomUnit() * pool.length)];
  const hadDuplicate = ownedCount(item) > 0;
  state.inventory[item.id] = ownedCount(item) + 1;
  state.history.unshift({ id: item.id, duplicate: hadDuplicate, at: Date.now() });
  state.history = state.history.slice(0, 20);

  const before = computeOutfit();
  const after = computeOutfit({ ...state.equipped, [item.slot]: item.id });
  pendingDrop = {
    item,
    duplicate: hadDuplicate,
    autoSold: false,
    sale: 0,
    delta: after.score - before.score,
    scoreAfter: after.score
  };

  updateBalance();
  saveState();

  spinInProgress = true;
  spinTimer = setTimeout(finishSpin, 3800);
  updateSpinChrome();
  animateReel(item);
  $('skipBtn').hidden = false;
  playHaptic('light');
  playTone(210, 0.06, 0.018, 'triangle');
}

function finishSpin() {
  if (!spinInProgress || !pendingDrop) return;
  clearTimeout(spinTimer);
  spinInProgress = false;
  document.querySelector('.reel-viewport')?.classList.remove('is-spinning');
  reelTrack.style.transition = 'none';
  reelTrack.style.transform = `translateX(${spinTargetOffset}px)`;
  const resultCard = reelTrack.querySelector('[data-result="true"]');
  if (resultCard) {
    resultCard.classList.add('is-result');
    resultCard.setAttribute('aria-label', `Твой дроп: ${itemLabel(pendingDrop.item)}`);
  }
  updateSpinChrome();
  playHaptic(pendingDrop.item.rarity === 'icon' || pendingDrop.item.rarity === 'legend' ? 'success' : 'light');
  playTone(pendingDrop.item.rarity === 'icon' ? 620 : 360, 0.1, 0.026, 'sine');
  const drop = pendingDrop;
  window.setTimeout(() => openDrop(drop), 170);
}

function openDrop(data) {
  if (!data) return;
  const item = data.item;
  const rarity = RARITY_META[item.rarity];
  const collection = COLLECTIONS[item.collection];
  const slot = SLOT_BY_ID[item.slot];
  dropModal.dataset.rarity = item.rarity;
  dropModal.style.setProperty('--rarity-color', rarity.color);
  dropModal.style.setProperty('--item-color', item.palette.main);
  dropModal.style.setProperty('--item-accent', item.palette.accent);
  dropModal.classList.toggle('is-duplicate', data.duplicate);
  $('dropRarity').textContent = `${data.duplicate ? 'ДУБЛЬ' : 'НОВОЕ'} · ${rarity.label.toUpperCase()}`;
  $('dropIndex').textContent = `№ ${String(item.index).padStart(3, '0')} / ${String(ITEMS.length).padStart(3, '0')}`;
  $('dropArt').innerHTML = itemArt(item);
  $('dropName').textContent = itemLabel(item);
  $('dropMeta').textContent = item.metaLine || `${collection.name} · ${slot.label.toUpperCase()}`;
  $('dropValue').innerHTML = `${formatCoins(item.sell)} <span>МОНЕТ</span>`;
  $('dropDelta').textContent = data.duplicate
    ? `ДУБЛЬ В ГАРДЕРОБЕ · ×${ownedCount(item)}`
    : 'НОВЫЙ ПРЕДМЕТ · В ГАРДЕРОБЕ';

  const actions = $('dropActions');
  actions.innerHTML = `
    <button class="secondary-btn danger" data-drop="sell">ПРОДАТЬ ЗА ${formatCoins(item.sell)}</button>
    <button class="primary-btn" data-drop="again"><span>ЕЩЁ</span><svg class="icon"><use href="#i-spark"></use></svg></button>`;

  actions.querySelectorAll('[data-drop]').forEach((button) => {
    button.addEventListener('click', () => handleDropAction(button.dataset.drop, data));
  });

  dropModal.classList.add('is-open');
  dropModal.setAttribute('aria-hidden', 'false');
  playHaptic(data.duplicate ? 'warning' : 'success');
}

function sellDropCopy(item) {
  const count = ownedCount(item);
  if (count <= 0) return;
  state.inventory[item.id] = count - 1;
  if (state.inventory[item.id] <= 0) delete state.inventory[item.id];
  state.wallet += item.sell;
  state.sold += 1;
  saveState();
  updateAll();
  closeDrop();
  showToast(`Продано: ${itemLabel(item)} · +${formatCoinsLong(item.sell)}`);
  playTone(300, 0.08, 0.02, 'triangle');
}

function continueSpin() {
  if (state.wallet < SPIN_COST) {
    closeDrop();
    showToast('Монеты закончились. Забери бонус дня.');
    openSheet('topupSheet');
    return;
  }
  if (activeSheet !== 'spinSheet') openSpinSheet(state.selectedSlot);
  window.setTimeout(() => performSpin(), 150);
}

function handleDropAction(action, data) {
  if (action === 'sell') {
    sellDropCopy(data.item);
    closeDrop();
    return;
  }
  if (action === 'again') {
    closeDrop();
    continueSpin();
  }
}

function closeDrop() {
  dropModal.classList.remove('is-open');
  dropModal.setAttribute('aria-hidden', 'true');
}

/* ---------- WARDROBE ---------- */

function itemCardHTML(item) {
  const rarity = RARITY_META[item.rarity];
  const collection = COLLECTIONS[item.collection];
  const slot = SLOT_BY_ID[item.slot];
  const count = ownedCount(item);
  const isLocked = count === 0;
  const isEquipped = state.equipped[item.slot] === item.id;
  return `
    <button class="item-card ${isLocked ? 'is-locked' : ''} ${isEquipped ? 'is-equipped' : ''}" data-item-id="${item.id}" data-rarity="${item.rarity}" style="--rarity-color:${rarity.color}; --item-color:${item.palette.main}; --item-accent:${item.palette.accent}" aria-label="${escapeHTML(itemLabel(item))}, ${escapeHTML(collection.name)}, ${rarity.label}${isLocked ? ', не выбит' : ''}">
      <span class="item-thumb">
        <span class="item-rank">${rarity.label.toUpperCase()}</span>
        ${isLocked ? '<span class="item-lock"><svg class="icon"><use href="#i-lock"></use></svg></span>' : ''}
        ${isEquipped ? '<span class="item-equipped">НАДЕТО</span>' : count > 1 ? `<span class="item-count">×${count}</span>` : ''}
        <span class="item-art">${itemArt(item)}</span>
      </span>
      <span class="item-name">${escapeHTML(itemLabel(item))}</span>
      <span class="item-meta"><span>${collection.name}${item.slot === 'hair' ? ` · ${HAIR_LENGTH_LABELS[item.hairLength] || ''}` : ''}</span><em>${formatCoins(item.sell)}</em></span>
    </button>`;
}

function collectionProgressHTML(collection) {
  const collectionItems = ITEMS.filter((item) => item.collection === collection.id);
  const owned = collectionItems.filter((item) => ownedCount(item) > 0).length;
  const percent = Math.round((owned / collectionItems.length) * 100);
  return `
    <div class="progress-card">
      <div class="progress-card-top"><b>${collection.name}</b><span>${owned}/${collectionItems.length}</span></div>
      <div class="progress-bar"><i style="--progress:${percent}%"></i></div>
      <small>${collection.tierLabel} · ${percent}% коллекции</small>
    </div>`;
}

function renderWardrobe() {
  const slotFilters = [{ id: 'all', label: 'Все' }, ...SLOTS];
  $('slotFilters').innerHTML = slotFilters.map((slot) => `
    <button class="filter-chip ${state.wardrobeSlot === slot.id ? 'is-active' : ''}" data-filter-slot="${slot.id}">${slot.label}</button>
  `).join('');

  const hairLengthFilters = $('hairLengthFilters');
  hairLengthFilters.hidden = state.wardrobeSlot !== 'hair';
  hairLengthFilters.innerHTML = state.wardrobeSlot === 'hair'
    ? [{ id: 'all', label: 'Все длины' }, { id: 'short', label: 'Короткие' }, { id: 'medium', label: 'Средние' }, { id: 'long', label: 'Длинные' }].map((length) => `
      <button class="filter-chip ${state.wardrobeHairLength === length.id ? 'is-active' : ''}" data-filter-hair-length="${length.id}">${length.label}</button>
    `).join('')
    : '';

  $('wardrobeCollections').innerHTML = [{ id: 'all', name: 'Все коллекции' }, ...Object.values(COLLECTIONS).map((collection) => ({ id: collection.id, name: collection.name }))].map((collection) => `
    <button class="collection-chip ${state.wardrobeCollection === collection.id ? 'is-active' : ''}" data-filter-collection="${collection.id}">${collection.name}</button>
  `).join('');

  const progressCollections = Object.values(COLLECTIONS)
    .slice()
    .sort((a, b) => {
      const aOwned = ITEMS.filter((item) => item.collection === a.id && ownedCount(item) > 0).length;
      const bOwned = ITEMS.filter((item) => item.collection === b.id && ownedCount(item) > 0).length;
      return bOwned - aOwned;
    })
    .slice(0, 2);
  $('collectionProgress').innerHTML = progressCollections.map(collectionProgressHTML).join('');

  const filtered = ITEMS.filter((item) => {
    if (state.wardrobeSlot !== 'all' && item.slot !== state.wardrobeSlot) return false;
    if (state.wardrobeCollection !== 'all' && item.collection !== state.wardrobeCollection) return false;
    if (state.wardrobeSlot === 'hair' && state.wardrobeHairLength !== 'all' && item.hairLength !== state.wardrobeHairLength) return false;
    return true;
  }).sort((a, b) => {
    const aEquipped = state.equipped[a.slot] === a.id ? 1 : 0;
    const bEquipped = state.equipped[b.slot] === b.id ? 1 : 0;
    if (aEquipped !== bEquipped) return bEquipped - aEquipped;
    const aOwned = ownedCount(a) > 0 ? 1 : 0;
    const bOwned = ownedCount(b) > 0 ? 1 : 0;
    if (aOwned !== bOwned) return bOwned - aOwned;
    return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || a.index - b.index;
  });

  const visible = filtered.slice(0, wardrobeLimit);
  const remaining = filtered.length - visible.length;
  $('wardrobeGrid').innerHTML = visible.length ? visible.map(itemCardHTML).join('') + (remaining > 0
    ? `<button class="wardrobe-more" data-wardrobe-more>ПОКАЗАТЬ ЕЩЁ · ${remaining}</button>`
    : '') : `<div class="wardrobe-empty"><p class="slot-empty-note">Ничего не найдено. Сбрось фильтр или прокрути спин.</p><button class="secondary-btn" data-reset-filters>СБРОСИТЬ ФИЛЬТРЫ</button></div>`;
  $('ownedCounter').textContent = ownedUniqueCount();
  $('catalogCounter').textContent = ITEMS.length;
}

function openItemSheet(item) {
  const rarity = RARITY_META[item.rarity];
  const collection = COLLECTIONS[item.collection];
  const slot = SLOT_BY_ID[item.slot];
  const count = ownedCount(item);
  const isEquipped = state.equipped[item.slot] === item.id;
  const sheet = $('itemSheet');
  sheet.dataset.rarity = item.rarity;
  sheet.style.setProperty('--rarity-color', rarity.color);
  sheet.style.setProperty('--item-color', item.palette.main);
  sheet.style.setProperty('--item-accent', item.palette.accent);
  $('itemSheetArt').innerHTML = itemArt(item);
  $('itemSheetRarity').textContent = `${rarity.label.toUpperCase()} · ${item.style}`;
  $('itemSheetName').textContent = itemLabel(item);
  $('itemSheetMeta').textContent = `${item.metaLine || `${collection.name} · ${slot.label.toUpperCase()}`}${item.brandLine ? ` · ${item.brandLine}` : ''}${item.slot === 'hair' ? ` · ${hairTextureLabel().toUpperCase()}` : item.variant === 'watch' ? ` · ${watchDialLabel().toUpperCase()} · ${watchStrapLabel().toUpperCase()}` : ''}`;
  $('itemSheetPoints').textContent = `+${item.points}`;
  $('itemSheetPrice').textContent = formatCoins(item.sell);
  $('itemSheetOwned').textContent = count > 0 ? `×${count}` : 'не выбит';

  const actions = $('itemSheetActions');
  if (count === 0) {
    actions.innerHTML = `<button class="secondary-btn" data-item-action="close">ЗАКРЫТЬ</button><button class="primary-btn" data-item-action="spin"><span>КРУТИТЬ</span><svg class="icon"><use href="#i-spark"></use></svg></button>`;
  } else if (isEquipped) {
    actions.innerHTML = `${count > 1 ? `<button class="secondary-btn danger" data-item-action="sell">ПРОДАТЬ · ${formatCoins(item.sell)}</button>` : '<button class="secondary-btn" data-item-action="close">ЗАКРЫТЬ</button>'}<button class="primary-btn" data-item-action="remove"><span>СНЯТЬ</span><svg class="icon"><use href="#i-close"></use></svg></button>`;
  } else {
    actions.innerHTML = `<button class="secondary-btn danger" data-item-action="sell">ПРОДАТЬ · ${formatCoins(item.sell)}</button><button class="primary-btn" data-item-action="equip"><span>НАДЕТЬ</span><svg class="icon"><use href="#i-check"></use></svg></button>`;
  }
  actions.querySelectorAll('[data-item-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.itemAction;
      if (action === 'close') closeSheets();
      if (action === 'equip') equipItem(item);
      if (action === 'remove') removeSlot(item.slot);
      if (action === 'sell') sellItem(item);
      if (action === 'spin') {
        closeSheets();
        openSpinSheet(item.slot);
      }
    });
  });
  openSheet('itemSheet');
}

function equipItem(item) {
  applyEquippedItem(item);
  closeTray();
  closeSheets();
  switchTab('look');
  const outfit = computeOutfit();
  showToast(outfit.score === 100 ? '100/100 · ИДЕАЛЬНЫЙ ЛУК' : `${itemLabel(item)} надет`);
  playHaptic('success');
}

function sellItem(item) {
  if (state.equipped[item.slot] === item.id && ownedCount(item) <= 1) {
    showToast('Сначала смени вещь в слоте');
    return;
  }
  if (ownedCount(item) <= 0) return;
  state.inventory[item.id] -= 1;
  if (state.inventory[item.id] <= 0) delete state.inventory[item.id];
  state.wallet += item.sell;
  state.sold += 1;
  saveState();
  closeSheets();
  updateAll();
  if (activeTab === 'wardrobe') renderWardrobe();
  showToast(`Продано: ${itemLabel(item)} · +${formatCoinsLong(item.sell)}`);
  playTone(300, 0.08, 0.02, 'triangle');
}

/* ---------- LEADERS ---------- */

function slotPipsForCurrent() {
  return SLOT_KEYS.map((slot) => {
    const item = getItem(state.equipped[slot]);
    return item ? item.rarity : null;
  });
}

function initials(name) {
  return escapeHTML(String(name).replace('@', '').slice(0, 2).toUpperCase());
}

function telegramUser() {
  const user = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe
    ? window.Telegram.WebApp.initDataUnsafe.user
    : null;
  if (!user || typeof user !== 'object') return { name: 'Гость', handle: 'Гость' };
  const display = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  const username = typeof user.username === 'string' ? user.username.trim() : '';
  const safeName = safeText(display || username || 'Гость', 40) || 'Гость';
  const safeHandle = username ? `@${safeText(username, 32)}` : safeName;
  return { name: safeName, handle: safeHandle };
}

function currentUserEntry() {
  const outfit = computeOutfit();
  const user = telegramUser();
  return {
    name: user.handle,
    title: outfit.full ? outfit.collection.title : outfit.score >= 90 ? 'ПОЧТИ ИДЕАЛЬНО' : outfit.score >= 80 ? 'СИЛЬНЫЙ ЛУК' : 'ЕСТЬ ХАРАКТЕР',
    score: outfit.score,
    set: outfit.collection ? outfit.collection.name : 'МИКС',
    pips: slotPipsForCurrent(),
    accent: '#ff5b4f',
    isSelf: true,
    displayName: user.name
  };
}

function getLeaderboard(period = state.leaderPeriod) {
  const base = ownValue(LEADERBOARDS, period) || LEADERBOARDS.week;
  const self = currentUserEntry();
  return [...base, self].sort((a, b) => b.score - a.score).map((player, index) => ({ ...player, rank: index + 1 }));
}

function renderLeaders() {
  const all = getLeaderboard();
  lastLeaderboard = all;
  const top = all.slice(0, 3);
  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean);
  $('podium').innerHTML = podiumOrder.map((player) => {
    const rank = clampInt(player.rank, 1, 999, 1);
    const score = clampInt(player.score, 0, 100, 0);
    const accent = safeColor(player.accent, '#ff5b4f');
    const pips = (Array.isArray(player.pips) ? player.pips : []).map((rarity) => `<span style="--pip:${pipColor(rarity)}"></span>`).join('');
    return `
    <div class="podium-card rank-${rank}">
      <span class="podium-rank">#${rank}</span>
      <div class="podium-avatar" style="--avatar-accent:${accent}">${initials(player.name)}</div>
      <div class="podium-name">${escapeHTML(player.name)}</div>
      <div class="podium-score">${score}</div>
      <div class="podium-title">${escapeHTML(player.title)}</div>
      <div class="podium-pips">${pips}</div>
    </div>`;
  }).join('');

  const rows = all.slice(3);
  $('leaderList').innerHTML = rows.map((player) => {
    const rank = clampInt(player.rank, 1, 999, 1);
    const score = clampInt(player.score, 0, 100, 0);
    const accent = safeColor(player.accent, '#ff5b4f');
    return `
    <button class="leader-row ${player.isSelf ? 'is-self' : ''}" data-player="${escapeHTML(player.name)}">
      <span class="leader-place">${String(rank).padStart(2, '0')}</span>
      <span class="leader-mini" style="color:${accent}">${initials(player.name)}</span>
      <span class="leader-copy"><b>${escapeHTML(player.name)}</b><small>${escapeHTML(player.title)} · ${escapeHTML(player.set)}</small></span>
      <span class="leader-score"><b>${score}</b><small>гармония</small></span>
    </button>`;
  }).join('');

  $('leaderTabs').querySelectorAll('button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.period === state.leaderPeriod);
  });

  const self = all.find((player) => player.isSelf);
  $('profileRank').textContent = `#${self ? self.rank : 4}`;
}

function openCompare(player) {
  if (!player) return;
  if (player.isSelf) {
    player = lastLeaderboard.find((entry) => !entry.isSelf) || lastLeaderboard[0];
    if (!player) return;
  }
  const outfit = computeOutfit();
  const self = currentUserEntry();
  const userPips = slotPipsForCurrent();
  const theirPips = Array.isArray(player.pips) ? player.pips : [];
  const theirScore = clampInt(player.score, 0, 100, 0);
  const delta = outfit.score - theirScore;
  $('compareGrid').innerHTML = `
    <div class="compare-card is-you">
      <span>ТЫ</span>
      <h3>${escapeHTML(self.name)}</h3>
      <div class="compare-big">${outfit.score}<em>/100</em></div>
      <div class="compare-title">${escapeHTML(outfit.collection ? outfit.collection.name : 'МИКС')} · ${outfit.setCount}/5</div>
      <div class="compare-pips">${userPips.map((rarity) => `<span style="--pip:${pipColor(rarity)}"></span>`).join('')}</div>
    </div>
    <div class="compare-card">
      <span>СОПЕРНИК</span>
      <h3>${escapeHTML(player.name)}</h3>
      <div class="compare-big">${theirScore}<em>/100</em></div>
      <div class="compare-title">${escapeHTML(player.title)} · ${escapeHTML(player.set)}</div>
      <div class="compare-pips">${theirPips.map((rarity) => `<span style="--pip:${pipColor(rarity)}"></span>`).join('')}</div>
    </div>
    <div class="compare-delta" style="grid-column:1/-1">${delta === 0 ? 'НИЧЬЯ' : delta > 0 ? `ТЫ ВЫШЕ НА <b>+${delta}</b>` : `СОПЕРНИК ВЫШЕ НА <b>${Math.abs(delta)}</b>`}</div>`;
  openSheet('compareSheet');
}

/* ---------- SHARE ---------- */

function updateSharePreview() {
  const outfit = computeOutfit();
  $('shareScore').textContent = outfit.score;
  $('shareSet').textContent = `${outfit.collection ? outfit.collection.name : 'МИКС'} · ${outfit.setCount}/5`;
  renderAvatarPortrait($('shareAvatar'));
}

function shareLook() {
  updateSharePreview();
  openSheet('shareSheet');
}

async function executeShare() {
  const outfit = computeOutfit();
  const appUrl = /^https?:$/.test(location.protocol) ? `${location.origin}${location.pathname}` : '';
  const text = `Мой лук в ЛУКАП: ${outfit.score}/100 · ${outfit.collection ? outfit.collection.name : 'МИКС'} ${outfit.setCount}/5`;
  const shareText = appUrl ? `${text}\n${appUrl}` : text;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'ЛУКАП', text: shareText, ...(appUrl ? { url: appUrl } : {}) });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      showToast('Текст лука скопирован');
      return;
    }
  } catch {
    // Share cancellation is not an error worth surfacing.
  }
  showToast(shareText);
}

/* ---------- SHEETS ---------- */

function openSheet(id) {
  closeDrop();
  closeTray();
  document.querySelectorAll('.sheet.is-open').forEach((sheet) => {
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
  });
  const sheet = $(id);
  if (!sheet) return;
  activeSheet = id;
  sheet.classList.add('is-open');
  sheet.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('is-open');
}

function closeSheets() {
  document.querySelectorAll('.sheet.is-open').forEach((sheet) => {
    sheet.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
  });
  activeSheet = null;
  backdrop.classList.remove('is-open');
}

function closeAllOverlays() {
  closeDrop();
  closeSheets();
  closeTray();
}

/* ---------- PROFILE QUICK ACTIONS ---------- */

function renderHistory() {
  const list = $('historyList');
  if (!list) return;
  if (!state.history.length) {
    list.innerHTML = '<div class="slot-empty-note">История пока пуста. Прокрути первый предмет.</div>';
    return;
  }
  list.innerHTML = state.history.map((entry) => {
    const item = getItem(entry.id);
    if (!item) return '';
    const rarity = RARITY_META[item.rarity];
    const collection = COLLECTIONS[item.collection];
    return `
      <div class="history-row" data-rarity="${item.rarity}" style="--rarity-color:${rarity.color}">
        <span class="history-art">${itemArt(item)}</span>
        <span class="history-copy"><b>${escapeHTML(itemLabel(item))}</b><small>${escapeHTML(collection.name)} · ${rarity.label}${entry.duplicate ? ' · дубль' : ''}</small></span>
        <em>${formatCoins(item.sell)}</em>
      </div>`;
  }).join('');
}

function renderAchievements() {
  const content = $('achievementsContent');
  if (!content) return;
  const outfit = computeOutfit();
  const owned = ownedUniqueCount();
  const perCollection = Object.values(COLLECTIONS).map((collection) => {
    const total = ITEMS.filter((item) => item.collection === collection.id).length;
    const have = ITEMS.filter((item) => item.collection === collection.id && ownedCount(item) > 0).length;
    return `
      <div class="achievement-collection">
        <div><b>${collection.name}</b><small>${have} / ${total}</small></div>
        <div class="achievement-bar"><span style="width:${Math.round((have / total) * 100)}%"></span></div>
      </div>`;
  }).join('');
  content.innerHTML = `
    <div class="achievement-hero">
      <span>ТЕКУЩАЯ ГАРМОНИЯ</span>
      <b>${outfit.score}</b>
      <small>${outfit.score === 100 ? 'Идеальный сет собран' : outfit.full ? 'Сет 5/5 · до 100 — пять икон' : 'До 100 — пять икон одного сета'}</small>
    </div>
    <div class="achievement-stats">
      <div><b>${state.bestScore}</b><span>лучший</span></div>
      <div><b>${owned}</b><span>предметов</span></div>
      <div><b>${outfit.full ? 1 : 0}</b><span>сет</span></div>
    </div>
    <div class="achievement-panel">
      <div class="panel-head"><span class="eyebrow">КОЛЛЕКЦИИ</span><span class="panel-note">всего ${ITEMS.length} вещей</span></div>
      ${perCollection}
    </div>
    <p class="panel-foot">Икона выпадает в ${formatChance(DROP_TABLE.icon)} случаев (≈ 1 из ${formatNumber(chanceDenominator(DROP_TABLE.icon))}). Полный сет из пяти икон — самый сложный уровень.</p>`;
}

/* ---------- TOPUP / ODDS ---------- */

function claimDailyBonus() {
  if (state.dailyClaimed) return;
  state.wallet += 500;
  state.dailyClaimed = true;
  state.dailyDate = todayKey();
  saveState();
  updateAll();
  showToast(`Бонус дня зачислен: +${formatCoinsLong(500)}`);
  playTone(480, 0.09, 0.022, 'sine');
  playHaptic('success');
}

function sellAllDuplicates() {
  let total = 0;
  let count = 0;
  ITEMS.forEach((item) => {
    const quantity = state.inventory[item.id] || 0;
    if (quantity > 1) {
      const extras = quantity - 1;
      state.inventory[item.id] = 1;
      total += extras * item.sell;
      count += extras;
    }
  });
  if (!count) {
    showToast('Лишних копий пока нет');
    return;
  }
  state.wallet += total;
  state.sold += count;
  saveState();
  updateAll();
  if (activeTab === 'wardrobe') renderWardrobe();
  showToast(`Продано ${count} дублей · +${formatCoinsLong(total)}`);
  playTone(340, 0.09, 0.024, 'sine');
}

function openOdds() {
  const rtp = Math.round(estimatedRtp());
  $('oddsContent').innerHTML = `
    <div class="odds-collection"><span>ОДИН ПРОКРУТ · ВСЕ 6 РЕДКОСТЕЙ</span><b>${formatCoins(SPIN_COST)} МОНЕТ</b></div>
    <p class="odds-note">Шанс зависит только от редкости. Он одинаков для всех слотов, коллекций и не меняется после прошлых прокрутов. Внутри редкости вещь выбирается равномерно.</p>
    <div class="odds-row odds-head"><span></span><b>РЕДКОСТЬ</b><span>ШАНС</span><em>ЦЕНА</em></div>
    ${RARITIES.map((rarity) => `<div class="odds-row">
      <span class="odds-dot" style="--rarity:${rarity.color}"></span>
      <b>${rarity.label}</b>
      <span>${formatChance(DROP_TABLE[rarity.id])}</span>
      <em>${formatCoins(rarity.sell)}</em>
    </div>`).join('')}
    <div class="odds-collection odds-foot"><span>СРЕДНЯЯ ЦЕННОСТЬ ДРОПА</span><b>${formatCoins(Math.round(estimatedDropValue()))} МОНЕТ</b></div>
    <p class="odds-note odds-footnote">Это ≈ ${rtp}% от цены прокрута, если продавать каждый дроп. Икона ≈ 1 из ${formatNumber(chanceDenominator(DROP_TABLE.icon))} прокрутов. Шанс глобальный, без подкрутки под игрока.</p>`;
  openSheet('oddsSheet');
}

/* ---------- NAV / PROFILE ---------- */

function switchTab(tab) {
  if (!['look', 'wardrobe', 'leaders', 'profile'].includes(tab)) return;
  activeTab = tab;
  closeAllOverlays();
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('is-active', screen.dataset.screen === tab);
  });
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === tab);
  });
  const screen = document.querySelector(`.screen[data-screen="${tab}"]`);
  if (screen) screen.scrollTop = 0;
  if (tab === 'wardrobe') renderWardrobe();
  if (tab === 'leaders') renderLeaders();
  if (tab === 'profile') updateProfile();
}

function updateAll() {
  window.itemArtTexture = state.hairTexture;
  window.itemArtWatchDial = state.watchDial;
  window.itemArtWatchStrap = state.watchStrap;
  updateBalance();
  updateLook();
  renderSlotRail();
  updateSpinChrome();
  updateProfile();
  if (activeTab === 'wardrobe') renderWardrobe();
  if (activeTab === 'leaders') renderLeaders();
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

/* ---------- AUDIO / HAPTICS ---------- */

function playTone(frequency, duration, volume, type = 'sine') {
  if (!state.sound) return;
  try {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + 0.02);
  } catch {
    // Audio is a progressive enhancement.
  }
}

function playHaptic(kind = 'light') {
  if (!state.sound) return;
  const telegram = window.Telegram && window.Telegram.WebApp;
  const hapticsSupported = telegram && telegram.HapticFeedback && (!telegram.isVersionAtLeast || telegram.isVersionAtLeast('6.1'));
  if (hapticsSupported) {
    if (kind === 'success') telegram.HapticFeedback.notificationOccurred('success');
    else if (kind === 'warning') telegram.HapticFeedback.notificationOccurred('warning');
    else telegram.HapticFeedback.impactOccurred(kind);
    return;
  }
  if (navigator.vibrate) {
    if (kind === 'success') navigator.vibrate([12, 30, 18]);
    else if (kind === 'warning') navigator.vibrate(12);
    else navigator.vibrate(7);
  }
}

/* ---------- INIT / EVENTS ---------- */

function renderWatchControls() {
  const dialMarkup = WATCH_DIALS.map((dial) => `
    <button data-watch-dial="${dial.id}" class="${state.watchDial === dial.id ? 'is-active' : ''}" aria-pressed="${state.watchDial === dial.id}">${dial.label}</button>
  `).join('');
  const strapMarkup = WATCH_STRAPS.map((strap) => `
    <button class="swatch watch-strap-swatch ${state.watchStrap === strap.id ? 'is-active' : ''}" data-watch-strap="${strap.id}" style="--swatch:${strap.color}" aria-label="${strap.label}" aria-pressed="${state.watchStrap === strap.id}"></button>
  `).join('');
  const dialHost = $('watchDialTabs');
  const strapHost = $('watchStrapSwatches');
  if (dialHost) dialHost.innerHTML = dialMarkup;
  if (strapHost) strapHost.innerHTML = strapMarkup;
}

function setWatchOption(kind, id) {
  if (kind === 'dial' && WATCH_DIALS.some((entry) => entry.id === id)) state.watchDial = id;
  else if (kind === 'strap' && WATCH_STRAPS.some((entry) => entry.id === id)) state.watchStrap = id;
  else return;
  window.itemArtWatchDial = state.watchDial;
  window.itemArtWatchStrap = state.watchStrap;
  saveState();
  updateAll();
  renderWatchControls();
  if ($('slotSheet').classList.contains('is-open')) renderSlotSheet();
  if (activeTab === 'wardrobe') renderWardrobe();
  playTone(420, 0.05, 0.015, 'sine');
  showToast(kind === 'dial' ? `Циферблат: ${watchDialLabel()}` : `Ремешок: ${watchStrapLabel().toLowerCase()}`);
}

function renderHairTextures() {
  const markup = HAIR_TEXTURES.map((texture) => `
    <button data-hair-texture="${texture.id}" class="${state.hairTexture === texture.id ? 'is-active' : ''}" aria-pressed="${state.hairTexture === texture.id}">${texture.label}</button>
  `).join('');
  const dialHost = $('watchDialTabs');
  if (dialHost && !dialHost.dataset.bound) {
    dialHost.dataset.bound = '1';
    dialHost.addEventListener('click', (event) => {
      const button = event.target.closest('[data-watch-dial]');
      if (button) setWatchOption('dial', button.dataset.watchDial);
    });
  }
  const strapHost = $('watchStrapSwatches');
  if (strapHost && !strapHost.dataset.bound) {
    strapHost.dataset.bound = '1';
    strapHost.addEventListener('click', (event) => {
      const button = event.target.closest('[data-watch-strap]');
      if (button) setWatchOption('strap', button.dataset.watchStrap);
    });
  }

  ['hairTextureTabs', 'hairTextureTabsProfile'].forEach((id) => {
    const host = $(id);
    if (host) host.innerHTML = markup;
  });
}

function setHairTexture(id) {
  if (!HAIR_TEXTURES.some((texture) => texture.id === id) || state.hairTexture === id) return;
  state.hairTexture = id;
  window.itemArtTexture = id;
  saveState();
  updateAll();
  if ($('slotSheet').classList.contains('is-open')) renderSlotSheet();
  if (activeTab === 'wardrobe') renderWardrobe();
  renderHairTextures();
  playTone(410, 0.05, 0.016, 'sine');
  showToast(`Текстура волос: ${hairTextureLabel(id).toLowerCase()}`);
}

function renderSkinSwatches() {
  $('skinSwatches').innerHTML = SKINS.map((skin, index) => `
    <button class="swatch ${state.skin === index ? 'is-active' : ''}" data-skin="${index}" style="--swatch:${skin.skin}" aria-label="${skin.name}"></button>
  `).join('');
}

function renderProfileBase() {
  $('bodyTabs').querySelectorAll('button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.body === state.body);
  });
  $('soundToggle').classList.toggle('is-on', state.sound);
}

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });
  $('brandBtn').addEventListener('click', () => switchTab('look'));

  $('balanceBtn').addEventListener('click', () => openSheet('topupSheet'));
  $('profileTopup').addEventListener('click', () => openSheet('topupSheet'));
  $('openSpinBtn').addEventListener('click', () => openSpinSheet(state.selectedSlot));
  $('spinBtn').addEventListener('click', performSpin);
  $('skipBtn').addEventListener('click', finishSpin);
  reelTrack.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'transform' && spinInProgress) finishSpin();
  });
  dropModal.addEventListener('click', (event) => {
    if (event.target === dropModal) closeDrop();
  });
  $('oddsBtn').addEventListener('click', openOdds);
  $('slotWardrobeBtn').addEventListener('click', () => openSlotSheet(state.selectedSlot));
  $('bonusClaimSheet').addEventListener('click', () => {
    closeSheets();
    claimDailyBonus();
  });
  $('sellDupesSheet').addEventListener('click', () => {
    sellAllDuplicates();
  });
  $('profileSellDupes').addEventListener('click', sellAllDuplicates);
  $('profileActions').addEventListener('click', (event) => {
    const button = event.target.closest('[data-profile-action]');
    if (!button) return;
    const action = button.dataset.profileAction;
    if (action === 'history') {
      renderHistory();
      openSheet('historySheet');
    } else if (action === 'achievements') {
      renderAchievements();
      openSheet('achievementsSheet');
    } else if (action === 'customize') {
      closeSheets();
      const panel = $('profileBasePanel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        panel.classList.remove('is-highlight');
        window.requestAnimationFrame(() => panel.classList.add('is-highlight'));
        window.setTimeout(() => panel.classList.remove('is-highlight'), 1600);
      }
    } else if (action === 'invite') {
      shareLook();
    }
  });
  $('removeSlotBtn').addEventListener('click', () => removeSlotSoft(state.selectedSlot));
  $('slotSpinBtn').addEventListener('click', () => {
    const slotId = state.selectedSlot;
    closeTray();
    openSpinSheet(slotId);
  });
  $('slotDoneBtn').addEventListener('click', closeTray);
  $('slotOwnedGrid').addEventListener('click', (event) => {
    const card = event.target.closest('[data-slot-item]');
    if (!card) return;
    const item = getItem(card.dataset.slotItem);
    if (!item) return;
    if (state.equipped[item.slot] === item.id) {
      showToast('Эта вещь уже надета');
      return;
    }
    applyEquippedItem(item);
    playHaptic('light');
  });
  $('compareTopBtn').addEventListener('click', () => {
    const top = lastLeaderboard[0];
    if (top) openCompare(top);
  });
  $('shareLookBtn').addEventListener('click', shareLook);
  $('shareActionBtn').addEventListener('click', executeShare);
  $('settingsBtn').addEventListener('click', () => {
    const screen = document.querySelector('.screen[data-screen="profile"]');
    if (screen) screen.scrollTo({ top: screen.scrollHeight, behavior: 'smooth' });
  });
  $('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Сбросить демо-прогресс ЛУКАП?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    state = createDefaultState();
    saveState();
    closeAllOverlays();
    renderAll();
    switchTab('look');
    showToast('Демо сброшено');
  });

  $('slotRail').addEventListener('click', (event) => {
    const card = event.target.closest('.slot-card');
    if (!card) return;
    const spinMark = event.target.closest('[data-spin-slot]');
    if (spinMark) openSpinSheet(spinMark.dataset.spinSlot);
    else openSlotSheet(card.dataset.slot);
  });

  $('avatarHotspots').addEventListener('click', (event) => {
    const hotspot = event.target.closest('[data-slot]');
    if (!hotspot) return;
    openSlotSheet(hotspot.dataset.slot);
  });

  $('wardrobeGrid').addEventListener('click', (event) => {
    if (event.target.closest('[data-reset-filters]')) {
      state.wardrobeSlot = 'all';
      state.wardrobeCollection = 'all';
      state.wardrobeHairLength = 'all';
      wardrobeLimit = 120;
      saveState();
      renderWardrobe();
      return;
    }
    if (event.target.closest('[data-wardrobe-more]')) {
      wardrobeLimit += 120;
      renderWardrobe();
      return;
    }
    const card = event.target.closest('.item-card');
    if (!card) return;
    const item = getItem(card.dataset.itemId);
    if (!item) return;
    if (!ownedCount(item) || state.equipped[item.slot] === item.id) {
      openItemSheet(item);
      return;
    }
    equipItem(item);
  });
  $('slotFilters').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter-slot]');
    if (!chip) return;
    state.wardrobeSlot = chip.dataset.filterSlot;
    wardrobeLimit = 120;
    saveState();
    renderWardrobe();
  });
  $('hairLengthFilters').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter-hair-length]');
    if (!chip) return;
    state.wardrobeHairLength = chip.dataset.filterHairLength;
    wardrobeLimit = 120;
    saveState();
    renderWardrobe();
  });

  $('wardrobeCollections').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter-collection]');
    if (!chip) return;
    state.wardrobeCollection = chip.dataset.filterCollection;
    wardrobeLimit = 120;
    saveState();
    renderWardrobe();
  });

  $('leaderTabs').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-period]');
    if (!button) return;
    state.leaderPeriod = button.dataset.period;
    saveState();
    renderLeaders();
  });
  $('leaderList').addEventListener('click', (event) => {
    const row = event.target.closest('.leader-row');
    if (!row) return;
    const player = lastLeaderboard.find((entry) => entry.name === row.dataset.player);
    if (player) openCompare(player);
  });

  $('bonusBtn').addEventListener('click', claimDailyBonus);

  ['hairTextureTabs', 'hairTextureTabsProfile'].forEach((id) => {
    const host = $(id);
    if (!host) return;
    host.addEventListener('click', (event) => {
      const button = event.target.closest('[data-hair-texture]');
      if (button) setHairTexture(button.dataset.hairTexture);
    });
  });

  $('skinSwatches').addEventListener('click', (event) => {
    const swatch = event.target.closest('[data-skin]');
    if (!swatch) return;
    state.skin = Number(swatch.dataset.skin);
    saveState();
    renderSkinSwatches();
    updateLook();
    updateProfile();
  });
  $('bodyTabs').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-body]');
    if (!button) return;
    state.body = button.dataset.body;
    saveState();
    renderProfileBase();
    updateLook();
    updateProfile();
  });
  $('soundToggle').addEventListener('click', () => {
    state.sound = !state.sound;
    saveState();
    renderProfileBase();
    if (state.sound) {
      playTone(440, 0.07, 0.02, 'sine');
      playHaptic('light');
      showToast('Звук и отклик включены');
    } else {
      showToast('Звук и отклик выключены');
    }
  });

  backdrop.addEventListener('click', closeAllOverlays);
  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.close === 'slotSheet') closeTray();
      else closeSheets();
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (dropModal.classList.contains('is-open')) closeDrop();
    else if ($('slotSheet').classList.contains('is-open')) closeTray();
    else closeSheets();
  });
}

function renderAll() {
  window.itemArtTexture = state.hairTexture;
  window.itemArtWatchDial = state.watchDial;
  window.itemArtWatchStrap = state.watchStrap;
  const rtpValue = $('rtpValue');
  if (rtpValue) rtpValue.textContent = `≈ ${Math.round(estimatedRtp())}%`;
  renderSkinSwatches();
  renderHairTextures();
  renderWatchControls();
  renderProfileBase();
  updateAll();
}

function initTelegram() {
  const telegram = window.Telegram && window.Telegram.WebApp;
  if (!telegram) return;
  try {
    const supports = (version) => !telegram.isVersionAtLeast || telegram.isVersionAtLeast(version);
    telegram.ready();
    telegram.expand();
    if (supports('6.1') && telegram.setHeaderColor) telegram.setHeaderColor('#f5f0e7');
    if (supports('6.1') && telegram.setBackgroundColor) telegram.setBackgroundColor('#f5f0e7');
    if (supports('7.0') && telegram.disableVerticalSwipes) telegram.disableVerticalSwipes();
  } catch {
    // The prototype also runs outside Telegram.
  }
}

const publicApi = {
  getState: () => JSON.parse(JSON.stringify(state)),
  getItems: () => ITEMS,
  getCollections: () => COLLECTIONS,
  getRarities: () => RARITY_META,
  getOdds: () => ({ dropTable: DROP_TABLE, rtp: estimatedRtp(), dropValue: estimatedDropValue(), spinCost: SPIN_COST }),
  getDiagnostics: () => CLIENT_DIAGNOSTICS.slice(),
  computeOutfit,
  itemLabel,
  itemIcon,
  openSlotSheet,
  openSpinSheet,
  applyEquippedItem,
  removeSlotSoft
};
Object.freeze(publicApi);
window.LUKAP = publicApi;

function init() {
  window.itemArtTexture = state.hairTexture;
  window.itemArtWatchDial = state.watchDial;
  window.itemArtWatchStrap = state.watchStrap;
  initTelegram();
  bindEvents();
  renderAll();
  switchTab('look');
  // Re-clone the portrait after fonts/layout settle.
  window.setTimeout(updateProfile, 120);
  window.setTimeout(() => {
    const fallback = $('renderFallback');
    if (fallback) fallback.hidden = $('appFrame').classList.contains('has-3d');
  }, 900);
}

init();
