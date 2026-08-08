import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { getProjectMetadata } from '../src/lib/projectMetadata'
import type { Profile, Project } from '../src/types/portfolio'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character])
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function assertExactlyOneRequiredId(html: string, id: string) {
  const pattern = new RegExp(
    `<[a-z][^>]*\\bid=["']${escapeRegExp(id)}["'][^>]*>`,
    'gi',
  )
  const matches = html.match(pattern) ?? []

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one required metadata id: ${id}; found ${matches.length}`,
    )
  }
}

function replaceTitle(html: string, id: string, content: string) {
  const pattern = new RegExp(
    `(<title\\b(?=[^>]*\\bid=["']${escapeRegExp(id)}["'])[^>]*>)[\\s\\S]*?(</title>)`,
    'i',
  )
  if (!pattern.test(html)) {
    throw new Error(
      `Required metadata id must identify a title element: ${id}`,
    )
  }

  return html.replace(
    pattern,
    (_match, openingTag: string, closingTag: string) => (
      `${openingTag}${escapeHtml(content)}${closingTag}`
    ),
  )
}

function replaceMetaContent(html: string, id: string, content: string) {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\bid=["']${escapeRegExp(id)}["'])[^>]*>`,
    'i',
  )
  const tag = html.match(pattern)?.[0]

  if (!tag) {
    throw new Error(
      `Required metadata id must identify a meta element: ${id}`,
    )
  }

  const contentPattern = /\bcontent=(["'])([\s\S]*?)\1/i

  if (!contentPattern.test(tag)) {
    throw new Error(`Missing content attribute on meta element: ${id}`)
  }

  const updatedTag = tag.replace(
    contentPattern,
    (_attribute, quote: string) => `content=${quote}${escapeHtml(content)}${quote}`,
  )

  return html.replace(tag, () => updatedTag)
}

export function renderProjectEntryHtml(
  rootHtml: string,
  project: Project,
  profile: Pick<Profile, 'name'>,
) {
  const requiredIds = [
    'page-title',
    'page-description',
    'page-og-title',
    'page-og-description',
    'page-og-url',
  ]

  requiredIds.forEach((id) => assertExactlyOneRequiredId(rootHtml, id))

  const metadata = getProjectMetadata(project, profile)
  let html = replaceTitle(rootHtml, 'page-title', metadata.title)
  html = replaceMetaContent(html, 'page-description', metadata.description)
  html = replaceMetaContent(html, 'page-og-title', metadata.ogTitle)
  html = replaceMetaContent(html, 'page-og-description', metadata.ogDescription)
  html = replaceMetaContent(html, 'page-og-url', metadata.ogUrl)
  return html
}

export function createProjectRouteEntriesPlugin(
  projects: readonly Project[],
  profile: Pick<Profile, 'name'>,
): Plugin {
  let outputDirectory = ''

  return {
    name: 'project-route-entries',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      if (!outputDirectory) {
        throw new Error('project-route-entries could not resolve the Vite output directory')
      }

      const indexPath = join(outputDirectory, 'index.html')
      const rootHtml = await readFile(indexPath, 'utf8')

      await Promise.all(projects.map(async (project) => {
        const routePath = join(outputDirectory, 'projects', project.id, 'index.html')
        await mkdir(dirname(routePath), { recursive: true })
        await writeFile(
          routePath,
          renderProjectEntryHtml(rootHtml, project, profile),
          'utf8',
        )
      }))

      await copyFile(indexPath, join(outputDirectory, '404.html'))
    },
  }
}
