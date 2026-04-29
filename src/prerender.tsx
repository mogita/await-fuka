import {VStack, HStack, Rectangle} from 'await';
import {
  eggAnim,
  petIdleAnim,
  petHungryAnim,
  petEatingAnim,
  petHappyAnim,
  poopSprite,
  feedIcon,
  cleanIcon,
  filledHeart,
  hollowHeart,
} from './sprites';
import {LED_FG} from './config';

// All sprites pre-render at 8px per cell. 24x24 sprites = 192x192, 12x6 icons
// = 96x48, 9x9 poop = 72x72, 5x5 hearts = 40x40.
const CELL_SIZE = 8;

// Render a brightness bitmap to a NativeView. Lit cells (value > 0) paint
// LED_FG with opacity = value * brightness. brightness is the global multiplier
// (used to dim unselected menu icons). Cells with value === 0 stay transparent.
function renderBitmap(sprite: readonly number[][], brightness: number = 1): NativeView {
  return (
    <VStack spacing={0}>
      {sprite.map(row => (
        <HStack spacing={0}>
          {row.map(v => {
            const lit = v > 0;
            return (
              <Rectangle
                sides={CELL_SIZE}
                fill={lit ? LED_FG : ''}
                opacity={lit ? v * brightness : 0}
              />
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
}

// Bypass pre-render only when explicitly identified as widget context.
// AwaitEnv.host on the Await app preview may not be exactly 'app' (could be a
// preview-specific value), so we use a permissive check: skip iff host is
// exactly 'widget'. App, preview, or anything else proceeds. The
// file-existence check below is the second guard and the one that actually
// short-circuits repeat runs.
const ASSET_NAMES: readonly string[] = [
  'icon-feed-normal.png',
  'icon-feed-selected.png',
  'icon-clean-normal.png',
  'icon-clean-selected.png',
  'pet-egg-0.png',
  'pet-egg-1.png',
  'pet-idle-0.png',
  'pet-idle-1.png',
  'pet-hungry-0.png',
  'pet-hungry-1.png',
  'pet-eating-0.png',
  'pet-eating-1.png',
  'pet-eating-2.png',
  'pet-eating-3.png',
  'pet-happy-0.png',
  'pet-happy-1.png',
  'poop.png',
  'heart-filled.png',
  'heart-hollow.png',
];

export function preRender(): void {
  if (AwaitEnv.host === 'widget') return;

  const fileSet = new Set(AwaitFile.files('assets'));
  const hasAll = ASSET_NAMES.every(name => fileSet.has(`assets/${name}`));
  if (hasAll) return;

  // Menu icons. Normal = dim (0.5), selected = full brightness (1.0).
  AwaitFile.saveUIRenderImage('assets/icon-feed-normal.png', renderBitmap(feedIcon, 0.5));
  AwaitFile.saveUIRenderImage('assets/icon-feed-selected.png', renderBitmap(feedIcon, 1));
  AwaitFile.saveUIRenderImage('assets/icon-clean-normal.png', renderBitmap(cleanIcon, 0.5));
  AwaitFile.saveUIRenderImage('assets/icon-clean-selected.png', renderBitmap(cleanIcon, 1));

  // Egg frames.
  for (let i = 0; i < eggAnim.frames.length; i++) {
    AwaitFile.saveUIRenderImage(`assets/pet-egg-${i}.png`, renderBitmap(eggAnim.frames[i]!));
  }

  // Idle frames.
  for (let i = 0; i < petIdleAnim.frames.length; i++) {
    AwaitFile.saveUIRenderImage(`assets/pet-idle-${i}.png`, renderBitmap(petIdleAnim.frames[i]!));
  }

  // Hungry frames.
  for (let i = 0; i < petHungryAnim.frames.length; i++) {
    AwaitFile.saveUIRenderImage(`assets/pet-hungry-${i}.png`, renderBitmap(petHungryAnim.frames[i]!));
  }

  // Eating frames.
  for (let i = 0; i < petEatingAnim.frames.length; i++) {
    AwaitFile.saveUIRenderImage(`assets/pet-eating-${i}.png`, renderBitmap(petEatingAnim.frames[i]!));
  }

  // Happy frames.
  for (let i = 0; i < petHappyAnim.frames.length; i++) {
    AwaitFile.saveUIRenderImage(`assets/pet-happy-${i}.png`, renderBitmap(petHappyAnim.frames[i]!));
  }

  // Poop and hearts.
  AwaitFile.saveUIRenderImage('assets/poop.png', renderBitmap(poopSprite));
  AwaitFile.saveUIRenderImage('assets/heart-filled.png', renderBitmap(filledHeart));
  AwaitFile.saveUIRenderImage('assets/heart-hollow.png', renderBitmap(hollowHeart));
}
