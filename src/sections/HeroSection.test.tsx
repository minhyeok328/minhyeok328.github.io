import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Profile } from '../types/portfolio'
import { HeroSection } from './HeroSection'

const profile: Profile = {
  name: '서민혁',
  greeting: '안녕하세요,',
  role: '프론트엔드 강점을 가진 AI 풀스택 개발자',
  description: '테스트 설명',
  profileImage: '',
  resumeUrl: '',
  blogUrl: '',
  email: '',
  githubUrl: 'https://github.com/minhyeok328',
  linkedinUrl: '',
}

describe('HeroSection', () => {
  it('places the verified GitHub link after the actions and before the profile visual while omitting empty links', () => {
    render(<HeroSection profile={profile} />)

    const hero = screen.getByRole('region', { name: '서민혁입니다.' })
    const heroScope = within(hero)
    const projectLink = heroScope.getByRole('link', { name: '프로젝트 보기' })
    const socialRegion = heroScope.getByRole('navigation', { name: '소셜 링크' })
    const githubLink = within(socialRegion).getByRole('link', { name: 'GitHub 보기' })
    const profileVisual = heroScope.getByRole('img', { name: '서민혁 프로필 사진 대체 이미지' })

    expect(githubLink).toHaveAttribute('href', 'https://github.com/minhyeok328')
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noreferrer')
    expect(within(socialRegion).queryByRole('link', { name: '블로그 보기' })).not.toBeInTheDocument()
    expect(within(socialRegion).queryByRole('link', { name: 'Email 보내기' })).not.toBeInTheDocument()
    expect(within(socialRegion).queryByRole('link', { name: 'LinkedIn 보기' })).not.toBeInTheDocument()
    expect(projectLink.compareDocumentPosition(socialRegion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(socialRegion.compareDocumentPosition(profileVisual) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps Blog, Email, and LinkedIn out of the Hero even when populated', () => {
    render(
      <HeroSection
        profile={{
          ...profile,
          blogUrl: 'https://minhyeok328.tistory.com/',
          email: 'hello@example.com',
          linkedinUrl: 'https://www.linkedin.com/in/example',
        }}
      />,
    )

    const socialRegion = screen.getByRole('navigation', { name: '소셜 링크' })
    const links = within(socialRegion).getAllByRole('link')

    expect(links.map((link) => link.textContent)).toEqual(['GitHub 보기'])
    expect(within(socialRegion).queryByRole('link', { name: '블로그 보기' })).not.toBeInTheDocument()
    expect(within(socialRegion).queryByRole('link', { name: 'Email 보내기' })).not.toBeInTheDocument()
    expect(within(socialRegion).queryByRole('link', { name: 'LinkedIn 보기' })).not.toBeInTheDocument()
  })
})
