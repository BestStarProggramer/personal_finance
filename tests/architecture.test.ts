import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../src/', import.meta.url))
const allowed: Record<string, string[]> = {
  app: ['app', 'pages', 'features', 'entities', 'shared'],
  pages: ['pages', 'features', 'entities', 'shared'],
  features: ['features', 'entities', 'shared'],
  entities: ['entities', 'shared'],
  shared: ['shared'],
}

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : /\.(ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

test('зависимости frontend направлены от приложения к общим модулям', () => {
  for (const file of files(source)) {
    const layer = relative(source, file).split(sep)[0]
    if (!allowed[layer]) continue // main.tsx is the entry point.
    for (const match of readFileSync(file, 'utf8').matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = relative(source, resolve(dirname(file), match[1])).split(sep)[0]
      assert.ok(allowed[layer].includes(target), `${relative(source, file)} imports ${match[1]}`)
    }
  }
})
