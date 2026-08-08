import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PageMetadata } from '../lib/projectMetadata'
import { DocumentMetadata } from './DocumentMetadata'

const metadata: PageMetadata = {
  title: '상세 제목',
  description: '상세 설명',
  ogTitle: '상세 OG 제목',
  ogDescription: '상세 OG 설명',
  ogUrl: 'https://minhyeok328.github.io/projects/test/',
}

describe('DocumentMetadata', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <title id="page-title">홈 제목</title>
      <meta id="page-description" name="description" content="홈 설명" />
      <meta id="page-og-title" property="og:title" content="홈 OG 제목" />
      <meta id="page-og-description" property="og:description" content="홈 OG 설명" />
      <meta id="page-og-url" property="og:url" content="https://minhyeok328.github.io/" />
    `
  })

  afterEach(() => {
    document.head.innerHTML = ''
  })

  it('applies route metadata and restores the previous values on unmount', () => {
    const view = render(<DocumentMetadata metadata={metadata} />)

    expect(document.title).toBe('상세 제목')
    expect(document.getElementById('page-description')).toHaveAttribute('content', '상세 설명')
    expect(document.getElementById('page-og-title')).toHaveAttribute('content', '상세 OG 제목')
    expect(document.getElementById('page-og-description')).toHaveAttribute('content', '상세 OG 설명')
    expect(document.getElementById('page-og-url')).toHaveAttribute('content', metadata.ogUrl)

    view.unmount()

    expect(document.title).toBe('홈 제목')
    expect(document.getElementById('page-description')).toHaveAttribute('content', '홈 설명')
  })
})
