# ЛУКАП

Telegram Mini App: fashion-gacha с процедурным 3D-аватаром, 1250 предметами и пятью слотами.

## Локально

```bash
npm start
```

Сервер: `http://localhost:4173`. Внешних зависимостей нет, нужен Node.js 20+.

Полезные команды:

```bash
npm run check     # HTML ids, SRI, CSP, ссылки, синтаксис
npm test          # unit-тесты и smoke-тест сервера
npm run e2e       # браузерный smoke на 320 и 390 px (Chrome)
npm run build     # check + test + сборка dist с хешем ассетов
npm run simulate  # 1M спинов: RTP и шансы икон
npm run simulate:cohort  # когорта игроков на 750 спинов
```

`localStorage` имеет версию (`lukap_stage1_v13`), старые сохранения мигрируются в `loadState()`.

Тема: `styles.css` — структурная база, `light.css` загружается последней и содержит единственный набор цветовых токенов.

## Cloudflare Pages

- Repository root: корень проекта.
- Build command: `npm run build`.
- Build output directory: `dist`.
- Deploy command: **оставить пустым** — Pages сам публикует `dist`. Если поле обязательно, указать `npx wrangler pages deploy dist --project-name lukap-tma`.
- Не использовать `npx wrangler deploy`: это команда Worker, для Pages она падает с `Missing entry-point`.
- Конфиг: `wrangler.toml`, security/cache-заголовки: `_headers`.
- Ручной деплой после `npx wrangler login`:

```bash
npm run deploy:cf
```

В Cloudflare включить Full (strict), Always Use HTTPS, отключить Rocket Loader / Auto Minify / Email Obfuscation. HTML не кэшировать, JS/CSS/шрифты — кэшировать.

## Render

- Тип: Web Service.
- Build command: `npm run build`.
- Start command: `node server.js`.
- Health check: `/healthz`.
- Blueprint: `render.yaml`.

Render отдаёт заголовки через `server.js`; `_headers` на Render не применяется. Для продакшена лучше платный инстанс, free-план засыпает.

На Render `server.js` подставляет клиентский лог-эндпоинт в `index.html`: ошибки уходят через `navigator.sendBeacon` в `POST /log` (лимит 20 запросов в минуту, тело до 4 КБ) и попадают в stdout инстанса. На Cloudflare Pages мета остаётся пустой, поэтому ошибки хранятся только в локальном буфере `LUKAP.getDiagnostics()`.

## Безопасность

- CSP и frame allowlist для Telegram: `config/csp.js`, `_headers`, meta.
- HSTS, Referrer-Policy, nosniff, Permissions-Policy, COOP/CORP в `server.js`.
- SRI для Three.js.
- Валидация и клампы `localStorage`, прототипно-безопасные lookup'ы, экранирование.
- `POST /log` принимает только короткие JSON-сообщения, ограничен по размеру и частоте; на статическом хостинге клиентский лог отключён.
- Клиентская экономика остаётся прототипом: для реальных монет нужен серверный RNG, ledger и проверка Telegram `initData`.
