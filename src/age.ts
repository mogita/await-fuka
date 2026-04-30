const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export function formatAge(worldMs: number): string {
	const ms = Math.max(0, worldMs)
	if (ms < HOUR_MS) {
		const minutes = Math.floor(ms / MINUTE_MS)
		return `${minutes}m`
	}
	const days = Math.floor(ms / DAY_MS)
	const hours = Math.floor((ms % DAY_MS) / HOUR_MS)
	return `${days}d ${hours}h`
}
