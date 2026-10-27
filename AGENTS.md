# LUKAP working agreement

This file is the project-level development contract. `DESIGN.md` is the locked visual system.

## ub-mode

Every change follows the reduced principles:

1. Make it work: the smallest edit that solves the problem, one decision in one place.
2. Make it right: pin the behavior, fix the root cause, split pure domain logic from the browser shell.
3. Follow practice: keep the change verifiable, log what changed and how it was proved, and clean up.

Work in small ordered units. Do not bolt a new requirement onto a broken design; remove complexity first. If two fixes share a failing premise, state the premise before writing another fix.

## Commands

```bash
npm run check      # static, CSP, catalog coverage
npm test           # 33 unit and server tests
npm run build      # tests + checks + dist
npm run e2e        # browser smoke on 320 and 390, Chrome required
npm run simulate   # 1M-spin economy simulation
```

A change is not finished until `npm run check`, `npm test`, `npm run build` pass, and `npm run e2e` passes for UI or 3D changes.

## Boundaries

- Never change `DROP_TABLE`, `SPIN_COST`, `RARITIES.sell`, `points`, `COLLECTIONS.cost` or `SET_BONUS` without an explicit owner decision.
- Never introduce real brand names, logos or counterfeit marks. Use the house brands.
- Keep the storage key `lukap_stage1_v13`; schema changes require a migration and a test.
- Do not weaken CSP, add external resources or add npm dependencies without agreement.
- Escape every external value that enters `innerHTML`.
- Do not commit or push without an explicit request. A push request covers only the named batch.

## Design

- `DESIGN.md` is the source of truth for type, tokens, controls, motion and states.
- Use Hallmark as an audit/polish framework, not as a literal marketing-page redesign. Its Floor rules on tracked caps, dashes, middots and 80-word screens conflict with the established editorial game UI and are recorded as deliberate non-applications in `DESIGN.md`.
- Keep one primary action per screen, real catalog/RTP numbers, and the light theme. Do not add purple or blue UI.
- All animation must respect `prefers-reduced-motion`.

## Log

For each batch, report: what changed, files, the commands run and their result, and any deviations from the plan. Keep QA artifacts out of the repository.
