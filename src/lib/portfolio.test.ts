import { describe, expect, it } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { getNavigationItems, getVisibleContactLinks } from './portfolio'

describe('portfolio visibility rules', () => {
  it('returns verified Contact links in the approved order', () => {
    expect(getVisibleContactLinks(portfolioData.profile)).toEqual([
      { label: 'GitHub', href: 'https://github.com/minhyeok328' },
      { label: '블로그', href: 'https://minhyeok328.tistory.com/' },
      { label: 'Email', href: 'mailto:tjalsgur328@gmail.com' },
    ])
  })

  it('keeps Project Journey nested under Projects and omits Experience without entries', () => {
    expect(getNavigationItems(portfolioData).map((item) => item.id)).toEqual([
      'about', 'work', 'projects', 'skills', 'contact',
    ])
  })

  it('keeps the four journey stages in chronological order', () => {
    expect(portfolioData.journeyProjects.map((project) => project.stage)).toEqual([
      'Data Integration', 'ML Experimentation', 'LLM & RAG', 'Web Integration',
    ])
  })

  it('does not publish the retired CODEOWNER role claim', () => {
    expect(JSON.stringify(portfolioData)).not.toMatch(/CODEOWNERS?/i)
    expect(portfolioData.flagshipProject.cardRoleSummary).toBe(
      'React·TypeScript 프론트엔드 구조와 서비스 통합 담당',
    )
  })

  it('keeps the flagship growth goal broader than a frontend-only position', () => {
    const growthGoal = portfolioData.flagshipProject.detail?.retrospective?.at(-1)

    expect(growthGoal).toContain('서비스 전체를 이해하고 연결하는 개발자')
    expect(growthGoal).not.toMatch(/프론트엔드 개발자로 성장/)
  })
})
