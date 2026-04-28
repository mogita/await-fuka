import {widget as renderWidget} from './widget';
import {widgetTimeline} from './timeline';
import {cycle, execute, cancel} from './intents';
import {GameState} from './state';

const app = Await.define({
  widget: (entry: WidgetEntry<{gameState: GameState}>): NativeView => renderWidget({
    family: entry.family,
    size: entry.size,
    now: entry.date.getTime(),
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
