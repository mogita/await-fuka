import { cancel, cycle, execute } from './intents'
import { preRender } from './prerender'
import { GameState } from './state'
import { widgetTimeline } from './timeline'
import { widget } from './widget'

// Pre-render the sprite PNGs on app load. No-op in widget context (host check)
// and when all expected assets are already cached on disk. Runs synchronously
// before Await.define so widget rendering can rely on the asset URLs.
preRender()

const app = Await.define({
	widget: (entry: WidgetEntry<{ gameState: GameState }>): NativeView =>
		widget({
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
})
