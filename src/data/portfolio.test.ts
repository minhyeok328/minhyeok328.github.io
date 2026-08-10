import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getOrderedProjects } from '../lib/projects'
import { portfolioData } from './portfolio'

const projects = getOrderedProjects(portfolioData)

describe('portfolio project evidence data', () => {
  it('uses the confirmed periods and official team repositories', () => {
    expect(projects.map(({ id, period, githubUrl }) => ({ id, period, githubUrl }))).toEqual([
      {
        id: 'vehicle-tco',
        period: '2026.02.05 – 02.06',
        githubUrl: 'https://github.com/joy-riders/joy-riders',
      },
      {
        id: 'bank-churners',
        period: '2026.03.16 – 03.17',
        githubUrl: 'https://github.com/SKN26-2nd-1st/2nd_project',
      },
      {
        id: 'pickle',
        period: '2026.04.24 – 04.27',
        githubUrl: 'https://github.com/SKN26-3rd-3rd/3rd_project',
      },
      {
        id: 'lg-home-ai',
        period: '2026.05.20 – 05.21',
        githubUrl: 'https://github.com/SKN26-4th-1st/4th_project',
      },
      {
        id: 'humour',
        period: '2026.05.22 – 07.15',
        githubUrl: 'https://github.com/SKN26-Final-1st/Final_project',
      },
    ])
  })

  it('connects every project to an existing poster, silent demo, and curated screenshots', () => {
    for (const project of projects) {
      expect(project.image).toBe(`/media/projects/${project.id}/poster.png`)
      expect(project.evidence?.videoSrc).toBe(`/media/projects/${project.id}/demo.webm`)
      expect(project.evidence?.disclosure.trim()).toBeTruthy()
      expect(project.evidence?.screenshots.length).toBeGreaterThanOrEqual(2)

      const mediaPaths = [
        project.image,
        project.evidence?.videoSrc,
        ...(project.evidence?.screenshots.map(({ src }) => src) ?? []),
      ]

      for (const mediaPath of mediaPaths) {
        expect(mediaPath).toBeTruthy()
        expect(existsSync(resolve('public', mediaPath?.replace(/^\//, '') ?? ''))).toBe(true)
      }
    }
  })

  it('attributes AWS to the HumouR team environment and limits the personal scope to integration and verification', () => {
    expect(projects.filter(({ operatingEnvironment }) => operatingEnvironment)).toEqual([
      expect.objectContaining({
        id: 'humour',
        operatingEnvironment: 'AWS 팀 배포 환경에서 프론트엔드·API 연동 및 동작 검증',
      }),
    ])

    const qualityAndDelivery = portfolioData.skillGroups.find(({ title }) => title === 'Quality & Delivery')

    expect(qualityAndDelivery?.experience).toContain('AWS deployment integration & verification')
    expect(qualityAndDelivery?.experience).not.toContain('AWS deployment configuration')
  })

  it('describes the Bank Churners capture as committed precomputed evidence without inference', () => {
    const bankChurners = projects.find(({ id }) => id === 'bank-churners')

    expect(bankChurners?.evidence?.disclosure).toBe(
      '충돌 없이 확인 가능한 커밋의 모델 지표와 EDA 산출물을 바탕으로 재구성한 사전 계산 증거입니다. 캡처 과정에서 고객 이탈 예측이나 새 모델 추론은 실행하지 않았습니다.',
    )
    expect(bankChurners?.evidence?.screenshots).toContainEqual({
      src: '/media/projects/bank-churners/strategy-report.png',
      alt: 'HistGradientBoosting 사전 계산 성능을 바탕으로 정리한 CRM 전략 가이드 화면',
      title: '사전 계산 전략 근거',
      caption: '커밋에서 확인한 HistGradientBoosting 성능 지표를 정적 CRM 전략 가이드와 연결해 표시했습니다. 이 화면에서 실시간 추론은 실행하지 않습니다.',
    })
  })
})
