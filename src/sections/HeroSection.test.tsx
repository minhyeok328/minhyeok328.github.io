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
  it('renders only the introduction and profile visual', () => {
    render(<HeroSection profile={profile} />)

    const hero = screen.getByRole('region', { name: '서민혁입니다.' })
    const heroScope = within(hero)

    expect(heroScope.queryByRole('link')).not.toBeInTheDocument()
    expect(heroScope.queryByRole('navigation')).not.toBeInTheDocument()
    expect(heroScope.getByRole('img', { name: '서민혁 프로필 사진 대체 이미지' })).toBeVisible()
  })

  it('does not create Hero destinations when optional profile links are populated', () => {
    render(
      <HeroSection
        profile={{
          ...profile,
          resumeUrl: '/resume.pdf',
          blogUrl: 'https://minhyeok328.tistory.com/',
          email: 'hello@example.com',
          linkedinUrl: 'https://www.linkedin.com/in/example',
        }}
      />,
    )

    const hero = screen.getByRole('region', { name: '서민혁입니다.' })
    const heroScope = within(hero)

    expect(heroScope.queryByRole('link')).not.toBeInTheDocument()
    expect(heroScope.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
