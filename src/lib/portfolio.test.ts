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

  it('omits Experience navigation when no verified entries exist', () => {
    expect(getNavigationItems(portfolioData).map((item) => item.id)).toEqual([
      'about', 'projects', 'journey', 'skills', 'contact',
    ])
  })

  it('keeps the four journey stages in chronological order', () => {
    expect(portfolioData.journeyProjects.map((project) => project.stage)).toEqual([
      'Data Integration', 'ML Experimentation', 'LLM & RAG', 'Web Integration',
    ])
  })
})
