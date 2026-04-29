# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## What this is

await-fuka is a Tamagotchi-style virtual pet widget for the **iPhone Await app** (https://await-app.com), not a regular web app. The runtime is SwiftUI-style with a custom JSX DSL provided by the host. Widgets ship as a single `.tsx` file copied to the iPhone manually.

## Commands

Pure-bun toolchain. No npm, yarn, or other package managers.

- `bun install` — install dependencies (only `typescript` and `@types/bun`).
- `bun test` — run the bun-builtin test runner against `src/**/*.test.ts`. Use `bun test src/foo.test.ts` to scope to one file.
- `bun run typecheck` — `tsc --noEmit`. Bun's transpiler does not typecheck; this is the only real type gate.
- `bun run build` — invokes `scripts/build.ts`. Concatenates `src/**` into `build/index.tsx`. Comments survive (this matters: see "Build pipeline" below).

There is no lint, no formatter, no dev server. The only on-device test path is to copy `build/index.tsx` to the Await iPhone app and observe.

## Build pipeline (the unusual part)

`scripts/build.ts` is a hand-rolled raw concatenator, **not** Bun's bundler. Reason: Bun's bundler discards comments during AST parsing regardless of `--minify` settings, which strips the `// @panel ...` directive that `src/config.ts` needs the Await runtime to read. The host parses the deployed `.tsx` directly to render its panel UI — minification is incompatible with that.

The concatenator:
1. Walks `src/` files in topological dependency order.
2. Strips local imports (`./...`) and `export` keywords.
3. Hoists every `import {...} from 'await'` to a single deduplicated line at the top.
4. Concatenates everything into one `.tsx` file. JSX is preserved as written; the iPhone runtime handles JSX itself.

**Gotchas:**
- The concatenator does NOT rewrite import aliases. Don't write `import {foo as bar}` in local imports — the alias breaks because the import line is stripped but the renamed identifier remains. Use the original name everywhere.
- All top-level declarations across `src/` end up in one global scope. Naming collisions across files are real bugs.
- Multi-line imports across newlines are normalized to one line by a regex; if you write unusually exotic import shapes, check the build output.

## Architecture

The data flow is a pipeline of pure functions wrapped at the boundaries by I/O:

```
AwaitStore <-> state.ts (load/save, GameState type, isValidState)
                 |
                 v
              tick.ts (continuous-time decay, nextInterestingMoment)
                 |
                 v
       intents.ts (applyCycle/applyExecute/applyCancel pure functions
                   plus side-effectful cycle/execute/cancel wrappers
                   that load -> tick -> apply -> save)
                 |
                 v
       timeline.ts (returns 30 entries pre-ticked at adaptive cadence:
                    200ms during action, 1000ms otherwise)
                 |
                 v
        assets.ts (petAssetUrl/feedIconUrl/cleanIconUrl: GameState + time
                   -> PNG path; picks the animation frame URL)
                 |
                 v
     widget.tsx + components/* (composes pre-rendered Image views in a
                                ZStack via 'await' DSL)
                 |
                 v
      index.tsx (preRender() then Await.define wires widget, timeline,
                 intents together)
```

Key architectural constraints:

- **Pre-rendered PNGs are the source of truth at render time.** `prerender.tsx` runs once on app load and saves 19 PNGs to `assets/` (one per sprite frame, plus normal/selected variants of the menu icons). The widget paints `<Image url={...}/>` views — no per-cell `Rectangle` matrix at render time. Bitmaps in `sprites.ts` remain the source of truth at PRE-RENDER time only.

- **State is held in `AwaitStore` under a versioned key** (`fuka.state.v1`). On corrupt or missing state, `loadOrInit` writes a fresh egg state with `installedAt = now` so hatch math has a fixed reference.

- **`tick` is idempotent and pure.** It advances state from any past timestamp to a later one, applying hatch transition, hunger decay (preserves fractional progress: `lastHungerCheckAt` advances by full intervals only), poop generation, and action expiry. Every entry point (timeline render, every intent) calls `tick` first. Re-applying with the same `now` is a no-op.

- **Intents are split into pure transitions and side-effectful wrappers.** `applyCycle/applyExecute/applyCancel` take state and return new state; tested directly. `cycle/execute/cancel` are thin wrappers (load → tick → apply → save) registered with `Await.define` as `widgetIntents`.

- **`worldSpeed` (in `src/config.ts`) divides every interval at runtime.** It's the only `@panel` value in the project — adjustable on-device via the Await app's panel UI without rebuilding. Tests verify the multiplier propagates through tick, intent, and timeline math.

## Pre-render system

The home-screen widget pre-renders all timeline entries simultaneously into a black-box cache, so per-entry view count multiplies into memory. The original 48×48 LED-matrix path generated ~2300 `Rectangle` cells per entry × 30+ entries → out of memory. Pre-rendered PNGs collapse this to ~30 view nodes per entry.

Boot order:

1. `index.tsx` calls `preRender()` synchronously at module load, **before** `Await.define`.
2. `preRender()` short-circuits in two cases:
   - **Host guard**: `AwaitEnv.host !== 'app'`. Pre-render only runs in the iPhone app context, never in the widget context (where `saveUIRenderImage` is unavailable and the memory budget is tight).
   - **File-existence guard**: all 19 expected paths under `assets/` already exist (checked via `AwaitFile.files('assets')`).
3. Otherwise it iterates each sprite (egg×2, idle×2, hungry×2, eating×4, happy×2, poop, hearts×2, menu icons×4 with normal/selected variants) and calls `AwaitFile.saveUIRenderImage(path, view)` to bake each one to disk.

Asset names in `assets.ts` (URL helpers) **must** match what `prerender.tsx` saves — there is no shared constant; the strings are typed by hand in both files. Add or rename a sprite in one place and you must mirror it in the other.

## Animation system

Pet sprites are `AnimatedSprite = {frames: readonly number[][][]; intervalMs: number}` (defined in `src/sprites.ts`). At pre-render time, each frame becomes a separate PNG. At render time, `assets.ts` selects the active frame URL via `Math.floor(now / intervalMs) % frames.length`. The `now` value comes from each timeline entry's `date`, not the wall clock at render time.

The timeline pre-computes 30 entries with state ticked forward to each entry's time, so action expiry / hunger drops happen on schedule even within one timeline window. Cadence is adaptive:

- **Action active** (eating or cleaning): 200ms cadence × 30 = 6s window. Tight enough that the 4-frame eating cycle at 200ms intervals renders every frame in order.
- **Idle/hungry/happy** (no action): 1000ms cadence × 30 = 30s window. Coarser; relies on the runtime honoring `update` to refresh between windows.

If autonomous animation freezes on-device after the window expires, the runtime's `update` directive isn't refreshing. Fix is more entries, not faster cadence — pets at idle don't need <1Hz cadence.

## Widget runtime constraints (read `runtime/await.d.ts`)

- **Only import from `'await'`.** Never use HTML tags (`<div>` resolves to `never` in the JSX environment). Components are listed in `runtime/await.d.ts`.
- **No React, no hooks, no `style={}` objects.** Visual styling is via props and modifiers documented in `types/prop.d.ts`.
- **Globals are ambient.** `AwaitStore`, `AwaitNetwork`, `AwaitEnv`, `AwaitUI`, `Date.now`, `setTimeout`, `print` are all available without imports — declared in `runtime/bridge.d.ts` and `types/global.d.ts`.
- **Widgets serialize on a single JS context.** Intents and timeline render are not concurrent; no locks needed.
- **`runtime/` and `types/` are vendored from the await-widget skill template.** Treat as read-only.

## Documentation

- `docs/superpowers/specs/2026-04-28-fuka-v0-design.md` — the v0 design spec. The architecture section is normative.
- `docs/superpowers/plans/2026-04-28-fuka-v0-impl.md` — the implementation plan that produced the current code, amended in-flight as discoveries happened (build pipeline, family naming, layout strip reservation).
- `demos/` — first-party Await widget reference implementations from the app author. Gitignored. Useful for studying patterns (`Game Tetris/index.tsx` is the closest analog — grid rendering, intents, theme, layout). Don't import from here at runtime.

## Conventions baked into this repo

- **No em dashes, smart quotes, or fancy punctuation.** Anywhere — code, comments, commit messages, docs. Use hyphens, parentheses, semicolons, or rephrase.
- **Commits are signed with the user's SSH key.** Never add `Co-Authored-By` trailers or any non-user author lines.
- **Never push, never commit to `main`/`master` from automation.** All work happens on feature branches; the user controls when integration to `main` happens.
- **Tests cover pure logic only** (`state`, `tick`, `intents`, `layout`, `assets`). JSX components, pre-render, and side-effectful wrappers are validated by `tsc --noEmit` plus on-device observation.
- **Don't add validation for impossible states.** `isValidState` guards the AwaitStore boundary; downstream code trusts the type system. Defensive checks for in-bounds values that the type system already enforces are not welcome.
