import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'

// Topological order: dependencies first, dependents last.
const FILES = [
	'src/config.ts',
	'src/layout.ts',
	'src/sprites.ts',
	'src/state.ts',
	'src/tick.ts',
	'src/assets.ts',
	'src/age.ts',
	'src/prerender.tsx',
	'src/components/ControlPanel.tsx',
	'src/components/PetScreen.tsx',
	'src/components/MenuScreen.tsx',
	'src/components/StatsScreen.tsx',
	'src/widget.tsx',
	'src/intents.ts',
	'src/timeline.ts',
	'src/index.tsx',
]

const NAMED_IMPORT =
	/import\s+(?:type\s+)?\{([^}]*?)\}\s+from\s+(['"][^'"]+['"]);?/g

await rm('./build', { recursive: true, force: true })
await mkdir('./build', { recursive: true })

const awaitNames = new Set<string>()
const segments: string[] = []

for (const path of FILES) {
	let content = await readFile(path, 'utf8')

	// Normalize multi-line named imports to a single line so subsequent
	// line-based regexes can match them.
	content = content.replace(
		NAMED_IMPORT,
		(_match, names: string, source: string) => {
			const oneline = names.replace(/\s+/g, ' ').trim()
			return `import {${oneline}} from ${source};`
		},
	)

	// Collect 'await' import names so we can hoist a single combined import.
	for (const match of content.matchAll(
		/^import\s+\{([^}]*)\}\s+from\s+['"]await['"]\s*;?\s*$/gm,
	)) {
		for (const raw of match[1]!.split(',')) {
			const name = raw.trim()
			if (name) awaitNames.add(name)
		}
	}

	// Strip 'await' imports (they will be hoisted at the top).
	content = content.replace(
		/^import\s+\{[^}]*\}\s+from\s+['"]await['"]\s*;?\s*\n?/gm,
		'',
	)

	// Strip local imports (./ or ../).
	content = content.replace(
		/^import\s+(?:type\s+)?\{[^}]*\}\s+from\s+['"]\.\.?\/[^'"]*['"]\s*;?\s*\n?/gm,
		'',
	)

	// Strip 'export' keyword from top-level declarations. Each file becomes a
	// section of one combined script; nothing actually re-exports anything.
	content = content.replace(
		/^export\s+(?=(?:type\s|const\s|function\s|class\s|interface\s|enum\s|let\s|var\s|async\s+function\s))/gm,
		'',
	)

	segments.push(content.trim())
}

const awaitImport = `import {${[...awaitNames].sort().join(', ')}} from 'await';`
const pad = (n: number) => String(n).padStart(2, '0')
const d = new Date()
// Block comment with no colons. The iPhone-side esbuild rejects '// Built: ...'
// at line 1 col 7 (something about the colon in a leading line comment),
// while a /* */ block with hyphen separators parses cleanly.
const builtAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}h${pad(d.getMinutes())}m${pad(d.getSeconds())}s`
const header = `/* Built ${builtAt} */`
const about = `/* About: Fuka is a PoC of game making in "await" app. It's inspired by Tamagotchi. Source https://github.com/mogita/await-fuka */`
const author = `/* Author: @mogita */`
const license = `/* License: MIT */`
const output = `${header}\n${about}\n${author}\n${license}\n${awaitImport}\n\n${segments.join('\n\n')}\n`

await writeFile('./build/index.tsx', output)
console.log(`Built build/index.tsx (${output.length} bytes)`)
