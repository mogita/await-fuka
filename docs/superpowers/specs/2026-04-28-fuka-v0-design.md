# Fuka v0 Design

Date: 2026-04-28
Status: Approved (ready for implementation plan)
Project: await-fuka
Author: collaborative brainstorming session

## 1. Overview

Fuka is a Tamagotchi-style virtual pet rendered as an Await widget on iPhone. The display is a 32x32 grayscale LED matrix simulated with `Rectangle` cells. Three buttons (A, B, C) drive a menu navigation model. v0 covers a hatch ceremony, hunger decay with feeding, and poop generation with cleaning.

Project name: "fuka" means "hatch" in Japanese. The pet starts as an egg on first install and hatches into the living pet.

## 2. Goals and Non-Goals

### v0 goals

- First-install hatch ceremony (egg -> pet, one-time).
- Hunger stat with continuous-time decay; feed action increments hunger.
- Poop generation on a fixed interval; clean action removes poop.
- Three-button navigation: A cycles menu cursor, B executes selected action, C cancels.
- Menu icons: Feed and Clean (no Status icon in v0).
- Always-visible hunger HUD at the bottom of the screen.
- Three widget families: small, medium, large, with the LED screen always square.
- Single `worldSpeed` panel slider to scale all time-based mechanics for testing.

### Non-goals (deferred to v1+)

- Death and restart flow.
- Sick state, medicine, or any health stat beyond hunger.
- Happiness, play, mini-games.
- Discipline, evolution branches, age, weight.
- Sleep cycle, lights.
- Multiple poops; status icon and dedicated status screen.
- Sound and haptic feedback for invalid actions.
- Animated sprites with cycling frames between user interactions.

## 3. Tooling and Project Layout

### Tooling

Pure Bun ecosystem. No npm, yarn, or other package managers.

- `bun install` for dependencies.
- `bun run build` for the bundler with externals plus minify.
- `bun run typecheck` for type checking via `tsc --noEmit` (Bun's bundler does not typecheck on its own).

`package.json`:

```json
{
  "name": "await-fuka",
  "private": true,
  "scripts": {
    "build": "bun build ./src/index.tsx --outfile=./build/index.tsx --external 'await' --external 'runtime/jsx-runtime' --target=browser --format=esm --minify",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^6.0.2"
  }
}
```

Two scripts:
- `bun run build` produces `build/index.tsx` (bundled, minified, externals preserved). Bun's bundler strips TypeScript types but does NOT typecheck; type errors are silently dropped.
- `bun run typecheck` runs `tsc --noEmit` for full type checking. This is the gate that catches missing imports, prop-shape mismatches against `await.d.ts`, and intent argument shape errors before build.

`tsconfig.json` is identical to the await-widget skill template (JSX preserved for type-check, jsxImportSource = `runtime`, paths to `./runtime/*` and `./*`).

`.gitignore`:

```
/build/
node_modules/
```

The build output is `./build/index.tsx`. The Await iPhone host treats it as the deployable widget file. Pre-transpiled JSX is acceptable; the host consumes the runtime imports left as externals.

### Project layout

```
await-fuka/
├── package.json
├── tsconfig.json
├── .gitignore
├── runtime/                 # from await-widget skill template
│   ├── await.d.ts
│   ├── bridge.d.ts
│   └── jsx-runtime.d.ts
├── types/                   # from skill template
│   ├── global.d.ts
│   ├── jsx.d.ts
│   └── prop.d.ts
├── demos/                   # untouched, reference only
├── docs/superpowers/specs/  # this file
├── src/
│   ├── index.tsx            # bundler entry; calls Await.define
│   ├── config.ts            # @panel worldSpeed, all timing constants
│   ├── state.ts             # GameState type, AwaitStore I/O, defaults
│   ├── tick.ts              # pure decay logic, next-interesting-moment
│   ├── intents.ts           # cycle, execute, cancel
│   ├── timeline.ts          # widgetTimeline body
│   ├── widget.tsx           # render root, family-switched layout
│   ├── layout.ts            # geometry per widget family
│   ├── sprites.ts           # bitmap definitions
│   ├── frame.ts             # composeFrame(state, ...) -> 32x32 number[][]
│   └── components/
│       ├── LedScreen.tsx    # renders a number[][] matrix
│       └── ControlPanel.tsx # A/B/C buttons
└── build/                   # gitignored; build output
    └── index.tsx
```

## 4. Configuration and Tuning

`src/config.ts`:

```ts
// @panel {type:'slider',min:1,max:100,step:1}
export const worldSpeed = 1;

// All intervals in milliseconds at worldSpeed=1 (realistic Tamagotchi pace).
// Effective interval at runtime: BASE / worldSpeed.
export const HUNGER_INTERVAL_MS = 60 * 60 * 1000;   // 60 min per heart drop
export const POOP_INTERVAL_MS   = 180 * 60 * 1000;  // 3 hours
export const HATCH_DURATION_MS  = 30 * 1000;        // 30 sec
export const ACTION_FEEDBACK_MS = 800;              // eating/cleaning sprite duration
```

`worldSpeed` is the only `@panel` declaration in the project. The Await app's panel UI lets the user adjust it on-device (slider 1 to 100, step 1, default 1). It is not surfaced in the widget UI itself.

All time-based logic divides base intervals by `worldSpeed` at the moment of computation, so panel changes take effect on the next render.

## 5. State Model

### GameState

```ts
type GameStage = 'egg' | 'pet';
type ActionKind = 'feed' | 'clean';
type MenuCursor = 'none' | 'feed' | 'clean';

type GameState = {
  installedAt: number;           // ms epoch, set on first ever read
  stage: GameStage;              // 'egg' until hatch completes
  hunger: number;                // clamped [0, 4]
  hasPoop: boolean;              // single poop in v0
  lastHungerCheckAt: number;     // advances by full intervals to preserve fractional progress
  lastPoopCheckAt: number;       // reset on poop appear or clean
  menuCursor: MenuCursor;
  action: { kind: ActionKind; until: number } | undefined;
};
```

### Persistence

Single AwaitStore key: `'fuka.state.v1'`. Versioned in the key so future schema changes can be detected and migrated.

`state.ts:loadOrInit(now)`:
1. Read key.
2. If undefined or shape validation fails (typeof per field), return fresh state:
   ```
   { installedAt: now, stage: 'egg', hunger: 4, hasPoop: false,
     lastHungerCheckAt: now, lastPoopCheckAt: now,
     menuCursor: 'none', action: undefined }
   ```
3. Write fresh state immediately so `installedAt` is fixed for hatch math.

`state.ts:save(state)` writes through to AwaitStore.

### Bounds and validation

- `hunger` clamped to `[0, 4]` after every mutation.
- `menuCursor` is a strict union; only cycle and cancel produce values.
- `action.until` is always future at write time; tick clears it once expired.

## 6. Decay Logic

`src/tick.ts` exposes one pure function and one helper:

```ts
function tick(state: GameState, now: number): GameState
function nextInterestingMoment(state: GameState, now: number): number
```

### tick rules

1. If `stage === 'egg'` and `now - installedAt >= HATCH_DURATION_MS / worldSpeed`:
   - `stage = 'pet'`
   - `lastHungerCheckAt = lastPoopCheckAt = now`
2. If `stage === 'pet'`:
   - `effectiveHungerInterval = HUNGER_INTERVAL_MS / worldSpeed`
   - `hungerTicks = floor((now - lastHungerCheckAt) / effectiveHungerInterval)`
   - `hunger = max(0, hunger - hungerTicks)`
   - `lastHungerCheckAt += hungerTicks * effectiveHungerInterval`  (preserves remainder so partial progress isn't lost)
   - If `!hasPoop && (now - lastPoopCheckAt) >= POOP_INTERVAL_MS / worldSpeed`:
     - `hasPoop = true`
     - `lastPoopCheckAt = now`
3. If `action && now >= action.until`:
   - `action = undefined`

Idempotent on already-current state. Calling `tick` twice with the same `now` returns the same result.

### nextInterestingMoment

Returns the earliest of:
- `installedAt + HATCH_DURATION_MS / worldSpeed`  (if `stage === 'egg'`)
- `lastHungerCheckAt + HUNGER_INTERVAL_MS / worldSpeed`  (if `stage === 'pet' && hunger > 0`)
- `lastPoopCheckAt + POOP_INTERVAL_MS / worldSpeed`  (if `stage === 'pet' && !hasPoop`)
- `action.until`  (if `action` set)

Used by the timeline to schedule the next refresh.

## 7. Timeline and Intents

### Timeline (`src/timeline.ts`)

```ts
function widgetTimeline(context: TimelineContext) {
  const now = Date.now();
  let state = loadOrInit(now);
  state = tick(state, now);
  save(state);
  const next = nextInterestingMoment(state, now);
  return {
    entries: [{ date: new Date(now), gameState: state }],
    update: new Date(next),
  };
}
```

One entry per render. The runtime refreshes us at `update`, which is exactly when the next decay tick is due. No autonomous polling.

### Intents (`src/intents.ts`)

Common preamble for every intent: load, tick to current time, mutate, save.

| Intent | Effect |
|---|---|
| `cycle()` (A) | If `stage === 'egg'`: no-op. Else `menuCursor`: `none` -> `feed` -> `clean` -> `none`. |
| `execute()` (B) | If `stage === 'egg'` or `action` set: no-op. If `menuCursor === 'feed' && hunger < 4`: `hunger++`, set `action = {kind:'feed', until: now + ACTION_FEEDBACK_MS / worldSpeed}`. If `menuCursor === 'clean' && hasPoop`: `hasPoop = false`, `lastPoopCheckAt = now`, set `action = {kind:'clean', until: now + ACTION_FEEDBACK_MS / worldSpeed}`. Else: no-op. |
| `cancel()` (C) | If `stage === 'egg'`: no-op. Else `menuCursor = 'none'`. |

Guards (all silent no-ops):
- All buttons during egg stage.
- B during action animation (prevents double-feed from fast tap).
- B with cursor=feed and hunger=4 (matches original "satiated, refuses food").
- B with cursor=clean and !hasPoop.
- B with cursor=none.

## 8. Rendering Pipeline

The 32x32 brightness matrix is the single source of truth. All visuals compose into one `number[][]` then render as `Rectangle` cells.

### Frame composition (`src/frame.ts`)

```ts
function composeFrame(state: GameState, now: number): number[][]
```

Paints in order onto a zeroed 32x32 buffer (background brightness = 0):

1. **Menu strip (rows 0-3)**: hidden when `stage === 'egg'`. Otherwise paint `feedIcon` at cols 4-17 and `cleanIcon` at cols 18-31. Cursor highlight is brightness-based: selected icon paints at full brightness (1.0); unselected paints at half brightness (0.5). When `menuCursor === 'none'` both icons paint at half brightness.
2. **Pet area (rows 7-22, cols 8-23, 16x16)**: select sprite by state:
   - `stage === 'egg'` -> `eggSprite`
   - `action?.kind === 'feed'` -> `petEatingSprite`
   - `action?.kind === 'clean'` -> `petHappySprite`
   - `hunger === 0` -> `petHungrySprite`
   - else -> `petIdleSprite`
3. **Poop (rows 17-22, cols 24-29, 6x6)**: paint `poopSprite` if `hasPoop && stage === 'pet'`. Sits to the lower-right of the pet, on the same ground line; does not overlap the pet's 16x16 bounding box.
4. **Ground line (row 23)**: dim row of cells across cols 4-27. Hidden during egg stage.
5. **Hunger HUD (rows 28-31)**: 4 hearts centered, each `filledHeart` if `index < hunger` else `hollowHeart`. Hidden during egg stage.

Painting is dumb: for each cell in the source bitmap, if its brightness > 0, write that brightness to the destination at the source's offset position. Cells with brightness 0 are treated as transparent (do not overwrite the destination). Later paints replace earlier paints. No alpha blending, no rotation. The paint order in section 8 is the layering order.

Sprites in v0 do not overlap (pet 16x16 at cols 8-23; poop 6x6 at cols 24-29; menu icons in rows 0-3; ground in row 23; hearts in rows 28-31). The "later paints replace earlier" rule matters only as a guarantee for future sprites.

### Sprite catalog (`src/sprites.ts`)

10 bitmaps, all hand-drawn as `readonly number[][]` literals:

| Name | Size | Used for |
|---|---|---|
| `eggSprite` | 16x16 | hatching state |
| `petIdleSprite` | 16x16 | default living pet |
| `petHungrySprite` | 16x16 | hunger === 0 |
| `petEatingSprite` | 16x16 | feed action feedback |
| `petHappySprite` | 16x16 | clean action feedback |
| `poopSprite` | 6x6 | when hasPoop |
| `feedIcon` | 14x4 | menu top-left |
| `cleanIcon` | 14x4 | menu top-right |
| `filledHeart` | 5x4 | hunger HUD |
| `hollowHeart` | 5x4 | hunger HUD |

Bitmaps are readable plain literals so values can be tweaked without tooling.

### LedScreen (`src/components/LedScreen.tsx`)

```tsx
type Props = { matrix: number[][]; cellSide: number };

function LedScreen({matrix, cellSide}: Props) {
  return (
    <VStack spacing={0} background={0.05}>
      {matrix.map(row => (
        <HStack spacing={0}>
          {row.map(v => <Rectangle fill={v} sides={cellSide} />)}
        </HStack>
      ))}
    </VStack>
  );
}
```

Cell color uses bare numbers as grayscale brightness, matching the Tetris demo convention. Background of the VStack uses `0.05` (slightly above pure black) so off-cells are still visible against the device frame.

### ControlPanel (`src/components/ControlPanel.tsx`)

Three Buttons labeled A, B, C wired to `app.cycle()`, `app.execute()`, `app.cancel()`. Layout direction (horizontal / vertical) is a prop driven by widget family. Each button gets equal share of the available strip.

### widget.tsx (root)

Receives `WidgetEntry` with `gameState`. Computes `cellSide = floor(min(size.width, size.height) / 32)`, calls `composeFrame(gameState, now)`, then arranges:

- `family === 'systemMedium'`: HStack with LedScreen on left, ControlPanel vertical on right.
- All other families (`systemSmall`, `systemLarge`, fallbacks): VStack with LedScreen on top, ControlPanel horizontal on bottom.

LED screen container is always a square (`32 * cellSide` per side). The button strip occupies the remaining real estate.

## 9. Layout per Widget Family

`src/layout.ts:layoutFor(family, size)` returns:

```ts
type Layout = {
  cellSide: number;       // pixel size of each LED cell
  screenSide: number;     // 32 * cellSide
  controlSize: number;    // strip thickness (height for horizontal, width for vertical)
  direction: 'horizontal' | 'vertical';
};
```

Rules:
- `cellSide = floor(min(size.width, size.height) / 32)`. Lower bound 1; if floor produces 0 the widget family is too small to render and we still emit 1 to avoid crashes.
- `screenSide = 32 * cellSide`.
- For `systemMedium`: `direction = 'horizontal'`, `controlSize = size.width - screenSide`.
- All others: `direction = 'vertical'`, `controlSize = size.height - screenSide`.

Buttons share `controlSize` evenly: each gets `floor(longSide / 3)` along the layout axis.

## 10. Edge Cases

- **First render ever**: AwaitStore returns undefined; `loadOrInit` writes a fresh egg state with `installedAt = now`.
- **Corrupt or wrong-shape state**: shape validation fails, treat as fresh install. No silent partial-recovery.
- **Schema migration**: not applicable in v0 (only one schema). Future bumps key to `'fuka.state.v2'` with explicit migration path.
- **Intent vs timeline race**: iPhone widget runtime serializes intent execution and timeline rendering in the same JS context; no concurrent mutation. Both paths use the same `load -> tick -> mutate -> save` sequence. Tick is idempotent on current state.
- **Fast double tap on B during action**: second press is a no-op because `action` is set. Animation latency the user accepted (500ms-1s) covers the lockout.
- **Egg stage button presses**: all three buttons are silent no-ops during egg. Menu state is preserved as initialized (`menuCursor = 'none'`).
- **Hunger overflow**: feeding at hunger=4 is no-op.
- **Clean with no poop**: no-op.
- **Unknown widget family**: falls back to vertical layout (small/large semantics).
- **worldSpeed change mid-run**: takes effect on next render; `lastHungerCheckAt` and `lastPoopCheckAt` represent absolute past timestamps so the formula stays correct across speed changes (the next interval simply scales).

## 11. Verification

### Local automated gates

Two scripts, both invoked via `bun run`:

`bun run typecheck` (`tsc --noEmit`):
- Catches missing imports, prop-shape mismatches against `await.d.ts`, intent argument shape errors, malformed bitmap arrays.
- Fastest signal. Run after every meaningful edit.

`bun run build` (`bun build` with externals + minify):
- Bundler resolves all local imports under `src/`.
- Externals `'await'` and `'runtime/jsx-runtime'` left as imports in output.
- Output: `./build/index.tsx`, ESM, minified.
- Bun's bundler strips types but does NOT typecheck. Run `typecheck` first.

### On-device manual checklist

You copy `build/index.tsx` to iPhone Await app, then verify:

1. First install: egg shows; menu hidden; ground/hearts hidden.
2. After 30s at worldSpeed=1 (or 0.3s at worldSpeed=100): hatches into petIdleSprite. Menu, ground, and 4 filled hearts appear.
3. A button: cursor cycles `none -> Feed -> Clean -> none`. Highlight visible.
4. B with cursor=Feed and hunger<4: hunger increments by 1, eating sprite for ~800ms, then idle. Hearts update.
5. B with cursor=Feed and hunger=4: silent no-op, sprite unchanged.
6. After ~3 hours at worldSpeed=1 (or ~108s at worldSpeed=100): poop appears at lower-right of pet.
7. B with cursor=Clean and hasPoop: poop disappears, happy sprite for ~800ms, then idle. Next poop appears one full interval later.
8. B with cursor=Clean and !hasPoop: silent no-op.
9. C button at any time: cursor returns to none.
10. After ~4 hours at worldSpeed=1 (or ~144s at worldSpeed=100): hunger reaches 0, sprite swaps to petHungrySprite.
11. worldSpeed slider in Await panel: change to 50, observe decay tempo doubles (since divide-by-worldSpeed doubles the rate).
12. All three widget families render correctly: screen always square, buttons fill remaining space, no clipping.

### Iteration approach

Set `worldSpeed = 100` during development to compress 4-hour cycles into ~144 seconds. Reset to `1` for daily use.

### What cannot be verified from the dev machine

- Visual appearance on iPhone (no headless renderer for the Await runtime).
- Exact widget refresh cadence (depends on Await app behavior, which we don't model).
- Whether the iPhone host accepts pre-transpiled JS in a `.tsx` file. The author has confirmed JSX transpilation works, so this is expected to pass; if the first build deploys but doesn't run, fall back to `--no-bundle` mode (transpile only) or rename output to `.js`.

## 12. Open Questions for v1+

- Does Await refresh widgets often enough to support cycled-frame animation? (Decides whether v1 can have "breathing" idle.)
- Is `AwaitAudio.playNote` viable for tap feedback in widgets, or is audio reserved for full-screen contexts?
- Should "Status" come back as a dedicated icon when v1 introduces age, weight, or feed count?
- Multi-poop accumulation: thematic but adds bookkeeping; reconsider in v1.
- Death and restart: needed once happiness or extended decay states are in.

These are not blocking v0 and explicitly out of scope.
