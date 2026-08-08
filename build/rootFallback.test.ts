import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createRootFallbackPlugin } from './rootFallback'

const emittedRootHtml = `<!doctype html>
<html lang="ko">
  <head><title>서민혁 포트폴리오</title></head>
  <body>
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/index-a1b2c3.js"></script>
  </body>
</html>`

async function invokeRootFallbackPlugin(outputRoot: string) {
  const outputDirectory = join(outputRoot, 'test-dist')
  const assetsDirectory = join(outputDirectory, 'assets')
  await mkdir(assetsDirectory, { recursive: true })
  await writeFile(join(outputDirectory, 'index.html'), emittedRootHtml, 'utf8')
  await writeFile(join(assetsDirectory, 'index-a1b2c3.js'), 'export {}', 'utf8')

  const plugin = createRootFallbackPlugin()

  if (typeof plugin.configResolved !== 'function' || typeof plugin.closeBundle !== 'function') {
    throw new TypeError('Root fallback plugin hooks must be callable')
  }

  plugin.configResolved.call({} as never, {
    root: outputRoot,
    build: { outDir: 'test-dist' },
  } as never)
  await plugin.closeBundle.call({} as never)

  return outputDirectory
}

describe('createRootFallbackPlugin', () => {
  it('copies the emitted root entry to 404 without generating project routes', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'root-fallback-'))

    try {
      const outputDirectory = await invokeRootFallbackPlugin(temporaryRoot)

      await expect(readFile(join(outputDirectory, 'index.html'), 'utf8'))
        .resolves.toBe(emittedRootHtml)
      await expect(readFile(join(outputDirectory, '404.html'), 'utf8'))
        .resolves.toBe(emittedRootHtml)
      await expect(access(join(outputDirectory, 'projects')))
        .rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  })
})
