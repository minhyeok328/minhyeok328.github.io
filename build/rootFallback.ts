import { copyFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'

export function createRootFallbackPlugin(): Plugin {
  let outputDirectory = ''

  return {
    name: 'root-fallback',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      if (!outputDirectory) {
        throw new Error('root-fallback could not resolve the Vite output directory')
      }

      await copyFile(
        join(outputDirectory, 'index.html'),
        join(outputDirectory, '404.html'),
      )
    },
  }
}
