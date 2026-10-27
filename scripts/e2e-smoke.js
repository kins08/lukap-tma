'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const HTTP_PORT = 4191;
const CDP_PORT = 9331;
const checks = [];
const failures = [];
const pageErrors = [];

function check(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), detail });
  if (!ok) failures.push(`${name}${detail ? ` (${detail})` : ''}`);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function waitFor(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.log('E2E SKIP · Chrome not found, set CHROME_PATH to run browser checks');
    process.exit(0);
  }
  if (typeof WebSocket === 'undefined') {
    console.log('E2E SKIP · WebSocket global unavailable in this Node version');
    process.exit(0);
  }

  const server = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(HTTP_PORT), LUKAP_SERVE_SOURCE: '1', NODE_ENV: 'test' },
    stdio: 'ignore'
  });
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lukap-e2e-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--use-gl=angle',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    for (const child of [chrome, server]) {
      if (!child.pid) continue;
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else child.kill('SIGTERM');
    }
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch { /* ignore */ }
  };

  try {
    const serverReady = await waitFor(`http://127.0.0.1:${HTTP_PORT}/healthz`);
    const cdpReady = await waitFor(`http://127.0.0.1:${CDP_PORT}/json/version`);
    if (!serverReady || !cdpReady) {
      console.log(`E2E FAIL · server=${serverReady} chrome=${cdpReady}`);
      process.exitCode = 1;
      return;
    }

    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json();
    const page = targets.find((target) => target.type === 'page');
    if (!page) {
      console.log('E2E FAIL · no browser page');
      process.exitCode = 1;
      return;
    }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let messageId = 0;
    const pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') {
        pageErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
      }
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    });
    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
    const send = (method, params = {}) => new Promise((resolve) => {
      const id = ++messageId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.result?.exceptionDetails) pageErrors.push(result.result.exceptionDetails.exception?.description || result.result.exceptionDetails.text);
      return result.result?.result?.value;
    };
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitForPage = async (expression, timeout = 12000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (await evaluate(expression)) return true;
        await wait(200);
      }
      return false;
    };
    const navigate = async (width, height) => {
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
      await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/?e2e=${width}` });
      await wait(700);
      await evaluate(`localStorage.removeItem('lukap_stage1_v13')`);
      await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/?e2e=${width}` });
      await wait(2600);
      return waitForPage(`Boolean(window.LUKAP && window.lukap3d) && document.getElementById('appFrame')?.classList.contains('has-3d')`);
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 780 }]) {
      const ready = await navigate(viewport.width, viewport.height);
      const tag = `${viewport.width}x${viewport.height}`;
      check(`${tag} app boots`, ready);
      if (!ready) continue;

      const base = await evaluate(`({
        items: LUKAP.getItems().length,
        coverage: window.__lukapCoverage?.missing || [],
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
        has3d: document.getElementById('appFrame').classList.contains('has-3d')
      })`);
      check(`${tag} catalog 1537`, base.items === 1537, String(base.items));
      check(`${tag} coverage complete`, base.coverage.length === 0, base.coverage.join(','));
      check(`${tag} no horizontal overflow`, base.overflow <= 0, String(base.overflow));
      check(`${tag} WebGL active`, base.has3d);

      for (const tab of ['wardrobe', 'leaders', 'profile']) {
        await evaluate(`document.querySelector('[data-tab="${tab}"]')?.click()`);
        await wait(350);
        const active = await evaluate(`document.querySelector('[data-screen="${tab}"]')?.classList.contains('is-active')`);
        check(`${tag} ${tab} tab opens`, active);
      }

      await evaluate(`document.getElementById('shareLookBtn')?.click()`);
      await wait(400);
      check(`${tag} share sheet opens`, await evaluate(`document.getElementById('shareSheet')?.classList.contains('is-open')`));
      await evaluate(`document.querySelector('[data-close="shareSheet"]')?.click()`);
      await wait(250);

      const beforeHair = await evaluate(`window.lukap3d.rebuilds`);
      await evaluate(`document.querySelectorAll('#hairTextureTabsProfile [data-hair-texture]')[1]?.click()`);
      await wait(500);
      const afterHair = await evaluate(`window.lukap3d.rebuilds`);
      check(`${tag} hair texture rebuilds 3D`, afterHair > beforeHair, `${beforeHair}→${afterHair}`);

      const watchId = await evaluate(`(() => { const watch = LUKAP.getItems().find((entry) => entry.variant === 'watch'); if (!watch) return null; LUKAP.applyEquippedItem(watch); return watch.id; })()`);
      await wait(400);
      const beforeDial = await evaluate(`window.lukap3d.rebuilds`);
      await evaluate(`document.querySelectorAll('#watchDialTabs [data-watch-dial]')[1]?.click()`);
      await wait(400);
      const afterDial = await evaluate(`window.lukap3d.rebuilds`);
      check(`${tag} watch dial rebuilds 3D`, Boolean(watchId) && afterDial > beforeDial, `${beforeDial}→${afterDial}`);
      const beforeStrap = await evaluate(`window.lukap3d.rebuilds`);
      await evaluate(`document.querySelectorAll('#watchStrapSwatches [data-watch-strap]')[1]?.click()`);
      await wait(400);
      const afterStrap = await evaluate(`window.lukap3d.rebuilds`);
      check(`${tag} watch strap rebuilds 3D`, afterStrap > beforeStrap, `${beforeStrap}→${afterStrap}`);

      await evaluate(`document.querySelector('[data-tab="wardrobe"]')?.click()`);
      await wait(400);
      const equippedId = await evaluate(`(() => {
        const card = [...document.querySelectorAll('.item-card')].find((node) => !node.classList.contains('is-locked') && !node.classList.contains('is-equipped'));
        if (!card) return null;
        const id = card.dataset.itemId;
        card.click();
        return id;
      })()`);
      await wait(450);
      const equipState = await evaluate(`(() => {
        const item = LUKAP.getItems().find((entry) => entry.id === ${JSON.stringify(equippedId)});
        if (!item) return null;
        return { slot: item.slot, equipped: LUKAP.getState().equipped[item.slot] === item.id, score: LUKAP.computeOutfit().score, uiScore: Number(document.getElementById('scoreValue').textContent) };
      })()`);
      check(`${tag} wardrobe equip applies`, equipState && equipState.equipped, equippedId || 'no card');
      check(`${tag} score recalculated`, equipState && equipState.score === equipState.uiScore, equipState ? `${equipState.score}/${equipState.uiScore}` : 'none');

      const emptyState = await evaluate(`(() => {
        state.wardrobeSlot = 'hair';
        state.wardrobeCollection = '__none__';
        renderWardrobe();
        const button = document.querySelector('[data-reset-filters]');
        if (button) button.click();
        return { hadButton: Boolean(button), slot: state.wardrobeSlot, collection: state.wardrobeCollection };
      })()`);
      check(`${tag} empty wardrobe offers reset`, emptyState.hadButton && emptyState.slot === 'all' && emptyState.collection === 'all', JSON.stringify(emptyState));

      await evaluate(`document.querySelector('[data-tab="look"]')?.click()`);
      await wait(300);
      await evaluate(`document.getElementById('openSpinBtn')?.click()`);
      await wait(400);
      const walletBefore = await evaluate(`LUKAP.getState().wallet`);
      await evaluate(`document.getElementById('spinBtn')?.click()`);
      await wait(500);
      await evaluate(`document.getElementById('skipBtn')?.click()`);
      await waitForPage(`document.getElementById('dropModal')?.classList.contains('is-open')`, 8000);
      await wait(350);
      const spin = await evaluate(`({
        open: document.getElementById('dropModal')?.classList.contains('is-open'),
        wallet: LUKAP.getState().wallet,
        drop: pendingDrop?.item?.id || null,
        history: LUKAP.getState().history[0]?.id || null,
        reel: document.querySelector('.reel-card[data-result="true"]')?.dataset.itemId || null,
        reelLabel: document.querySelector('.reel-card[data-result="true"]')?.getAttribute('aria-label') || null
      })`);
      check(`${tag} spin deducts 100`, spin.wallet === walletBefore - 100, `${walletBefore}→${spin.wallet}`);
      check(`${tag} reel equals drop and history`, spin.drop && spin.drop === spin.history && spin.drop === spin.reel, `${spin.drop}/${spin.history}/${spin.reel}`);
      check(`${tag} reel card has label`, Boolean(spin.reelLabel), spin.reelLabel || 'empty');
    }

    await evaluate(`localStorage.setItem('lukap_stage1_v13', JSON.stringify({ wallet: 4321, inventory: { 'noir-top-norm': 2 }, equipped: { top: 'noir-top-norm' } }))`);
    await send('Page.reload');
    await wait(2400);
    await waitForPage('Boolean(window.LUKAP)');
    const migration = await evaluate(`(() => {
      const state = LUKAP.getState();
      return { version: state.version, wallet: state.wallet, count: state.inventory['noir-top-norm'], top: state.equipped.top };
    })()`);
    check('legacy save migrates to version 2', migration && migration.version === 2, JSON.stringify(migration));
    check('legacy save keeps wallet and inventory', migration && migration.wallet === 4321 && migration.count === 2, JSON.stringify(migration));

    const fatal = pageErrors.filter((message) => !/ERR_TUNNEL|fonts\.googleapis|fonts\.gstatic|telegram\.org|net::ERR_/i.test(message));
    check('no page errors', fatal.length === 0, fatal.slice(0, 3).join(' | '));
    ws.close();
  } finally {
    cleanup();
  }

  const failed = checks.filter((item) => !item.ok);
  for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} · ${item.name}${item.detail ? ` · ${item.detail}` : ''}`);
  console.log(`\nE2E ${failed.length ? 'FAIL' : 'OK'} · ${checks.length - failed.length}/${checks.length} checks`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error('E2E FAIL ·', error);
  process.exitCode = 1;
});
