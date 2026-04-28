import {widget} from './widget';
import {widgetTimeline} from './timeline';
import {cycle, execute, cancel} from './intents';
import {GameState} from './state';

const app = Await.define({
  widget: (entry: WidgetEntry<{gameState: GameState}>): NativeView => widget({
    family: entry.family,
    size: entry.size,
    gameState: entry.gameState,
    cycleIntent: app.cycle(),
    executeIntent: app.execute(),
    cancelIntent: app.cancel(),
  }),
  widgetTimeline,
  widgetIntents: {
    cycle,
    execute,
    cancel,
  },
});
