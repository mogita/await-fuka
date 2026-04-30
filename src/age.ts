const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function formatAge(worldMs: number): string {
	const ms = Math.max(0, worldMs)
	if (ms < HOUR_MS) {
		const minutes = Math.floor(ms / 60000)
		return `${minutes}m`
	}
	const days = Math.floor(ms / DAY_MS)
	const hours = Math.floor((ms - days * DAY_MS) / HOUR_MS)
	return `${days}d ${hours}h`
}
