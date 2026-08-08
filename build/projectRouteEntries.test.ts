import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { portfolioData } from '../src/data/portfolio'
import { getOrderedProjects } from '../src/lib/projects'
import {
  createProjectRouteEntriesPlugin,
  renderProjectEntryHtml,
} from './projectRouteEntries'

const rootHtml = `<!doctype html>
<html lang="ko">
  <head>
    <title id="page-title">기존 제목</title>
    <meta id="page-description" name="description" content="기존 설명" />
    <meta id="page-og-title" property="og:title" content="기존 OG 제목" />
    <meta id="page-og-description" property="og:description" content="기존 OG 설명" />
    <meta id="page-og-url" property="og:url" content="https://minhyeok328.github.io/" />
  </head>
  <body><div id="root"></div></body>
</html>`

const expectedProjectMetadata = [
  {
    id: 'humour',
    title: 'HumouR | 서민혁 포트폴리오',
    description: '기업 정보, 채용 공고, 지원서 분석, 리포트, 면접 질문과 문서 챗을 하나의 흐름으로 연결한 AI 기반 채용 운영 서비스입니다.',
    url: 'https://minhyeok328.github.io/projects/humour/',
  },
  {
    id: 'vehicle-tco',
    title: '차량 운영·관리 비용 계산 시스템 | 서민혁 포트폴리오',
    description: '차량별 운영 비용을 데이터 기반으로 비교하는 TCO 계산 시스템입니다.',
    url: 'https://minhyeok328.github.io/projects/vehicle-tco/',
  },
  {
    id: 'bank-churners',
    title: '신용카드 고객 이탈 분석 | 서민혁 포트폴리오',
    description: '고객 데이터를 탐색하고 이탈 가능성을 분석한 머신러닝 프로젝트입니다.',
    url: 'https://minhyeok328.github.io/projects/bank-churners/',
  },
  {
    id: 'pickle',
    title: 'PICKLE 맛집 추천 챗봇 | 서민혁 포트폴리오',
    description: '사용자 조건을 구조화하고 실제 매장 데이터를 검색해 추천하는 챗봇입니다.',
    url: 'https://minhyeok328.github.io/projects/pickle/',
  },
  {
    id: 'lg-home-ai',
    title: 'LG Home AI 가전 상담 | 서민혁 포트폴리오',
    description: 'LLM 상담 기능을 계정과 대화방 중심의 웹 서비스로 통합한 프로젝트입니다.',
    url: 'https://minhyeok328.github.io/projects/lg-home-ai/',
  },
] as const

async function invokeProjectRoutePlugin(outputRoot: string) {
  const outputDirectory = join(outputRoot, 'test-dist')
  await mkdir(outputDirectory)
  await writeFile(join(outputDirectory, 'index.html'), rootHtml, 'utf8')

  const plugin = createProjectRouteEntriesPlugin(
    getOrderedProjects(portfolioData),
    portfolioData.profile,
  )

  if (typeof plugin.configResolved !== 'function' || typeof plugin.closeBundle !== 'function') {
    throw new TypeError('Project route plugin hooks must be callable')
  }

  plugin.configResolved.call({} as never, {
    root: outputRoot,
    build: { outDir: 'test-dist' },
  } as never)
  await plugin.closeBundle.call({} as never)

  return outputDirectory
}

describe('renderProjectEntryHtml', () => {
  it('replaces every route metadata value without changing the app root', () => {
    const result = renderProjectEntryHtml(
      rootHtml,
      portfolioData.flagshipProject,
      portfolioData.profile,
    )

    expect(result).toContain('<title id="page-title">HumouR | 서민혁 포트폴리오</title>')
    expect(result).toContain(`content="${portfolioData.flagshipProject.description}"`)
    expect(result).toContain('content="https://minhyeok328.github.io/projects/humour/"')
    expect(result).toContain('<div id="root"></div>')
    expect(result).not.toContain('기존 제목')
    expect(result).not.toContain('기존 설명')
  })

  it('escapes project metadata before placing it in HTML', () => {
    const result = renderProjectEntryHtml(
      rootHtml,
      {
        ...portfolioData.flagshipProject,
        title: 'A&B $& <테스트>',
        description: '"인용" $& <설명>',
      },
      portfolioData.profile,
    )

    expect(result).toContain('A&amp;B $&amp; &lt;테스트&gt; | 서민혁 포트폴리오')
    expect(result).toContain('content="&quot;인용&quot; $&amp; &lt;설명&gt;"')
  })

  it('throws when a required metadata element is missing', () => {
    expect(() => renderProjectEntryHtml(
      rootHtml.replace('id="page-og-url"', 'id="missing-og-url"'),
      portfolioData.flagshipProject,
      portfolioData.profile,
    )).toThrow('page-og-url')
  })

  it('throws when the required title element is duplicated', () => {
    expect(() => renderProjectEntryHtml(
      rootHtml.replace(
        '</head>',
        '<title id="page-title">중복 제목</title></head>',
      ),
      portfolioData.flagshipProject,
      portfolioData.profile,
    )).toThrow('page-title')
  })

  it('throws when a required meta element is duplicated', () => {
    expect(() => renderProjectEntryHtml(
      rootHtml.replace(
        '</head>',
        '<meta id="page-og-url" property="og:url" content="https://example.com/" /></head>',
      ),
      portfolioData.flagshipProject,
      portfolioData.profile,
    )).toThrow('page-og-url')
  })

  it('rejects a required metadata id duplicated on a different tag', () => {
    expect(() => renderProjectEntryHtml(
      rootHtml.replace(
        '<div id="root"></div>',
        '<div id="root"></div><div id="page-og-url"></div>',
      ),
      portfolioData.flagshipProject,
      portfolioData.profile,
    )).toThrow('page-og-url')
  })
})

describe('createProjectRouteEntriesPlugin', () => {
  it('writes only the five stable project entries and the 404 fallback', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'project-route-entries-'))

    try {
      const outputDirectory = await invokeProjectRoutePlugin(temporaryRoot)
      const entries = (await readdir(outputDirectory, { recursive: true }))
        .map((entry) => entry.replaceAll('\\', '/'))
        .sort()

      expect(entries).toEqual([
        '404.html',
        'index.html',
        'projects',
        'projects/bank-churners',
        'projects/bank-churners/index.html',
        'projects/humour',
        'projects/humour/index.html',
        'projects/lg-home-ai',
        'projects/lg-home-ai/index.html',
        'projects/pickle',
        'projects/pickle/index.html',
        'projects/vehicle-tco',
        'projects/vehicle-tco/index.html',
      ])
      await expect(readFile(join(outputDirectory, '404.html'), 'utf8')).resolves.toBe(rootHtml)
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  })

  it('binds every stable metadata id to each project route value', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'project-route-metadata-'))

    try {
      const outputDirectory = await invokeProjectRoutePlugin(temporaryRoot)

      for (const expected of expectedProjectMetadata) {
        const html = await readFile(
          join(outputDirectory, 'projects', expected.id, 'index.html'),
          'utf8',
        )
        expect(html).toContain(`<title id="page-title">${expected.title}</title>`)
        expect(html).toContain(
          `<meta id="page-description" name="description" content="${expected.description}" />`,
        )
        expect(html).toContain(
          `<meta id="page-og-title" property="og:title" content="${expected.title}" />`,
        )
        expect(html).toContain(
          `<meta id="page-og-description" property="og:description" content="${expected.description}" />`,
        )
        expect(html).toContain(
          `<meta id="page-og-url" property="og:url" content="${expected.url}" />`,
        )
      }
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  })
})
