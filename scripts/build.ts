import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'

const minify = process.argv.includes('--minify')

// Topological order: dependencies first, dependents last.
const FILES = [
	'src/config.ts',
	'src/layout.ts',
	'src/sprites.ts',
	'src/sprites/bodies.ts',
	'src/sprites/faces.ts',
	'src/sprites/heads.ts',
	'src/state.ts',
	'src/evolution.ts',
	'src/tick.ts',
	'src/assets.ts',
	'src/age.ts',
	'src/prerender.tsx',
	'src/components/ControlPanel.tsx',
	'src/components/AdultPetSprite.tsx',
	'src/components/PetScreen.tsx',
	'src/components/MenuScreen.tsx',
	'src/components/StatsScreen.tsx',
	'src/widget.tsx',
	'src/intents.ts',
	'src/timeline.ts',
	'src/index.tsx',
]

const NAMED_IMPORT =
	/import\s+(?:type\s+)?\{([^}]*?)\}\s+from\s+(['"][^'"]+['"])[ \t]*;?/g

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

const pkg = JSON.parse(await readFile('./package.json', 'utf8'))
const version: string = pkg.version ?? '0.0.0'

const awaitImport = `import {${[...awaitNames].sort().join(', ')}} from 'await';`
const pad = (n: number) => String(n).padStart(2, '0')
const d = new Date()
// Block comment with no colons. The iPhone-side esbuild rejects '// Built: ...'
// at line 1 col 7 (something about the colon in a leading line comment),
// while a /* */ block with hyphen separators parses cleanly.
const builtAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}h${pad(d.getMinutes())}m${pad(d.getSeconds())}s`
const header = `/* Built ${builtAt} */`
const versionLine = `/* Version: ${version} */`
const about = `/* About: Fuka is a PoC of game making in "await" app. It's inspired by Tamagotchi. Source https://github.com/mogita/await-fuka */`
const author = `/* Author: @mogita */`
const license = `/* License: MIT */`
const output = `${header}\n${versionLine}\n${about}\n${author}\n${license}\n${awaitImport}\n\n${segments.join('\n\n')}\n`

await writeFile('./build/index.tsx', output)
console.log(`Built build/index.tsx (${output.length} bytes)`)

if (minify) {
	// --minify-whitespace + --minify-syntax (skip --minify-identifiers): with
	// --jsx=preserve the JSX text references original component names (e.g.
	// <ZStack/>), but renaming the imports to short aliases (`ZStack as H`)
	// would break those references at runtime. Skip identifier mangling to keep
	// JSX and external names (Await.define, intents, asset urls) addressable.
	const minifyProc = Bun.spawn(
		[
			'bunx',
			'esbuild',
			'./build/index.tsx',
			'--minify-whitespace',
			'--minify-syntax',
			'--jsx=preserve',
			'--target=es2020',
			'--log-level=error',
		],
		{ stderr: 'pipe', stdout: 'pipe' },
	)
	const minified = await new Response(minifyProc.stdout).text()
	const minifyStderr = await new Response(minifyProc.stderr).text()
	const minifyCode = await minifyProc.exited
	if (minifyCode !== 0) {
		console.error(minifyStderr)
		console.error('Minification FAILED.')
		process.exit(1)
	}
	await writeFile('./build/index.tsx', minified)
	const ratio = Math.round((minified.length / output.length) * 100)
	console.log(`Minified to ${minified.length} bytes (${ratio}% of dev).`)
}

const proc = Bun.spawn(
	[
		'bunx',
		'esbuild',
		'./build/index.tsx',
		'--bundle=false',
		'--log-level=error',
	],
	{
		stderr: 'pipe',
		stdout: 'pipe',
	},
)
const stderr = await new Response(proc.stderr).text()
const code = await proc.exited
if (code !== 0) {
	console.error(stderr)
	console.error('Bundle validation FAILED.')
	process.exit(1)
}
console.log('Bundle validation OK.')
