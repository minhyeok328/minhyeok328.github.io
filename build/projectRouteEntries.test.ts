import { describe, expect, it } from 'vitest'
import { portfolioData } from '../src/data/portfolio'
import { renderProjectEntryHtml } from './projectRouteEntries'

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
})
