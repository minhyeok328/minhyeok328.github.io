import { describe, expect, it } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { getProjectMetadata, homeMetadata, notFoundMetadata } from './projectMetadata'

describe('project metadata', () => {
  it('builds canonical HumouR metadata', () => {
    expect(getProjectMetadata(portfolioData.flagshipProject, portfolioData.profile)).toEqual({
      title: 'HumouR | 서민혁 포트폴리오',
      description: portfolioData.flagshipProject.description,
      ogTitle: 'HumouR | 서민혁 포트폴리오',
      ogDescription: portfolioData.flagshipProject.description,
      ogUrl: 'https://minhyeok328.github.io/projects/humour/',
    })
  })

  it('keeps stable home and not-found metadata', () => {
    expect(homeMetadata.ogUrl).toBe('https://minhyeok328.github.io/')
    expect(notFoundMetadata.title).toBe('페이지를 찾을 수 없습니다 | 서민혁 포트폴리오')
  })
})
