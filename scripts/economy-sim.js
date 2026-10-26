'use strict';

const DROP_TABLE = { base: 60.62, norm: 27, trend: 10, couture: 2, legend: 0.35, icon: 0.03 };
const SELL = { base: 45, norm: 90, trend: 170, couture: 550, legend: 1800, icon: 28000 };
const POOL = { base: 150, norm: 67, trend: 25, couture: 5, legend: 2, icon: 2 };
const SPIN_COST = 100;
const START_WALLET = 10000;
const USERS = 1000;
const MAX_SPINS = 750;

const saleAllRtp = Object.keys(DROP_TABLE).reduce((sum, rarity) => sum + (DROP_TABLE[rarity] / 100) * SELL[rarity], 0) / SPIN_COST * 100;

function rollRarity(random) {
  const roll = random() * 100;
  let cursor = 0;
  for (const [rarity, chance] of Object.entries(DROP_TABLE)) {
    cursor += chance;
    if (roll < cursor) return rarity;
  }
  return 'base';
}

let duplicateSales = 0;
let spinsDone = 0;
let icons = 0;
let iconSpinTotal = 0;
let profitableUsers = 0;
let walletTotal = 0;

for (let user = 0; user < USERS; user += 1) {
  let wallet = START_WALLET;
  const owned = new Set();
  let userIcons = 0;
  let userIconSpin = null;
  let spins = 0;
  while (spins < MAX_SPINS && wallet >= SPIN_COST) {
    wallet -= SPIN_COST;
    spins += 1;
    spinsDone += 1;
    const rarity = rollRarity(Math.random);
    if (rarity === 'icon') {
      icons += 1;
      userIcons += 1;
      if (userIconSpin === null) userIconSpin = spins;
    }
    const slot = Math.floor(Math.random() * 5);
    const item = `${slot}:${rarity}:${Math.floor(Math.random() * (POOL[rarity] || 1))}`;
    if (owned.has(item)) {
      wallet += SELL[rarity];
      duplicateSales += SELL[rarity];
    } else {
      owned.add(item);
    }
  }
  if (userIconSpin !== null) iconSpinTotal += userIconSpin;
  if (wallet > START_WALLET) profitableUsers += 1;
  walletTotal += wallet;
}

console.log(JSON.stringify({
  users: USERS,
  spins: spinsDone,
  saleAllRtp: +saleAllRtp.toFixed(2),
  duplicateRtp: +(duplicateSales / (spinsDone * SPIN_COST) * 100).toFixed(2),
  averageFinalWallet: Math.round(walletTotal / USERS),
  profitableUsersPct: +(profitableUsers / USERS * 100).toFixed(1),
  icons,
  averageSpinsToIcon: icons ? Math.round(iconSpinTotal / icons) : null
}, null, 2));
