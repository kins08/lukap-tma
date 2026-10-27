# Design: ЛУКАП

The locked system for the Telegram Mini App; catalog 1537, including the Russian 2026 capsule. `light.css` is the palette source; `styles.css` is the structural base. This is a Hallmark-informed audit/polish contract, not a claim that the app passes Hallmark's marketing-page Floor.

## System

- Genre: editorial, app screen (not a marketing page)
- Shape: app shell with four screens: look, wardrobe, leaders, profile
- Theme: LUKAP light editorial (custom: warm paper, red accent, gold rules)
- Audience and job: Russian-speaking Telegram users collect five-slot looks; the primary action on the look screen is the spin.

## Tokens

```css
--bg: #f5f0e7;        --surface: #fffdf8;   --surface-2: #faf5ec;
--surface-3: #f0e7d9; --text: #201c17;      --muted: #7d7265;
--muted-2: #a69a8b;   --red: #d83a2b;       --red-deep: #b8291e;
--gold: #a77a3b;      --line: rgba(54, 42, 29, .12);
--font-display: "Unbounded", "Arial Black", sans-serif;
--font-body: "Manrope", "Segoe UI", sans-serif;
--nav-height: 68px;   --radius: 16px;
```

Rarity colors are semantic tokens: base, norm, trend, couture, legend, icon. Literal shades inside SVG item art and gradients are artwork, not UI tokens.

## Type

Display: Unbounded for scores, names, sheet headings. Body: Manrope. Primary text 11px or more; secondary labels 10px; decorative serials may be smaller. Uppercase tracked labels are an intentional editorial signature.

## Controls

- Primary: red gradient, white ink, full width on action rows.
- Secondary: paper surface, ink border, same radius.
- Minimum touch target: 44×44 on coarse pointers.
- Focus: 2px gold outline with 2px offset, visible instantly.

## Motion

Calm and weighted: 160–420ms, `cubic-bezier(.2, .8, .2, 1)`; transform and opacity only. Every animation has a reduced-motion fallback. The 3D stage has idle breathing, an equip pulse and camera sway; sheets slide, cards press, the reel lands on the real drop.

## States

Every interactive control has default, hover, active, focus-visible, disabled and busy states. Disabled uses fill, ink and cursor, not opacity alone. Empty wardrobe offers reset; missing coins open the top-up sheet; no WebGL shows the 2D avatar and a notice.

## Hallmark audit record

Applied technical findings: decorative SVGs get `aria-hidden`; `overflow-x: clip` on html/body; focus-visible for all controls; disabled buttons use fill, ink and cursor; display headings wrap.

Deliberate non-applications: literal color tokenization across item art (48), tracked uppercase labels (54/67), long dashes (19), metadata separated by middle dots (63), dense game-screen copy (58), and a Hallmark stamp (20). These are product and editorial decisions, so the app does not claim a Hallmark Floor pass. The scripted perfect-score aura (62) is decorative and hidden only until earned.

## Exports

`light.css` and `styles.css` in this repository. No Tailwind or generated token layer.
