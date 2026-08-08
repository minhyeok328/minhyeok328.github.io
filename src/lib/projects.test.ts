import { describe, expect, it } from 'vitest'
import { portfolioData } from '../data/portfolio'
import type { Project } from '../types/portfolio'
import {
  findProjectById,
  getAdjacentProjects,
  getOrderedProjects,
  getProjectContributionItems,
  getProjectPath,
  getProjectRoleSummary,
} from './projects'

describe('project helpers', () => {
  const projects = getOrderedProjects(portfolioData)

  it('orders every project by the existing growth order', () => {
    expect(projects.map((project) => project.id)).toEqual([
      'vehicle-tco',
      'bank-churners',
      'pickle',
      'lg-home-ai',
      'humour',
    ])
  })

  it('builds the canonical trailing-slash route from a project id', () => {
    expect(getProjectPath(portfolioData.flagshipProject)).toBe('/projects/humour/')
  })

  it('finds a known project and rejects an unknown id', () => {
    expect(findProjectById(projects, 'pickle')?.title).toBe('PICKLE 맛집 추천 챗봇')
    expect(findProjectById(projects, 'missing')).toBeUndefined()
    expect(findProjectById(projects, undefined)).toBeUndefined()
  })

  it('resolves previous and next projects at the middle and both boundaries', () => {
    expect(getAdjacentProjects(projects, 'pickle')).toMatchObject({
      previous: { id: 'bank-churners' },
      next: { id: 'lg-home-ai' },
    })
    expect(getAdjacentProjects(projects, 'vehicle-tco')).toMatchObject({
      previous: null,
      next: { id: 'bank-churners' },
    })
    expect(getAdjacentProjects(projects, 'humour')).toMatchObject({
      previous: { id: 'lg-home-ai' },
      next: null,
    })
  })

  it('uses the first contribution as role copy without repeating it in detail', () => {
    const project = {
      contribution: ['??븷 ?붿빟', '援ы쁽 A', '援ы쁽 B'],
    } as Project

    expect(getProjectRoleSummary(project)).toBe('??븷 ?붿빟')
    expect(getProjectContributionItems(project)).toEqual(['援ы쁽 A', '援ы쁽 B'])
  })

  it('keeps every contribution when explicit card role copy exists', () => {
    const project = {
      cardRoleSummary: '紐낆떆????븷 ?붿빟',
      contribution: ['援ы쁽 A', '援ы쁽 B'],
    } as Project

    expect(getProjectRoleSummary(project)).toBe('紐낆떆????븷 ?붿빟')
    expect(getProjectContributionItems(project)).toEqual(['援ы쁽 A', '援ы쁽 B'])
  })

  it('treats a blank card role as absent in both fallback helpers', () => {
    const project = {
      cardRoleSummary: '   ',
      contribution: ['??븷 ?붿빟', '援ы쁽 A'],
    } as Project

    expect(getProjectRoleSummary(project)).toBe('??븷 ?붿빟')
    expect(getProjectContributionItems(project)).toEqual(['援ы쁽 A'])
  })
})
