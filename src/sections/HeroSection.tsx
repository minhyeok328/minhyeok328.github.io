import { ImageWithFallback } from '../components/ImageWithFallback'
import { getVisibleHeroLinks } from '../lib/portfolio'
import type { Profile } from '../types/portfolio'

interface HeroSectionProps {
  profile: Profile
}

export function HeroSection({ profile }: HeroSectionProps) {
  const socialLinks = getVisibleHeroLinks(profile)

  return (
    <section id="top" className="site-container hero" aria-labelledby="hero-heading">
      <div className="hero__content">
        <p className="hero__greeting">{profile.greeting}</p>
        <h1 id="hero-heading">{profile.name}입니다.</h1>
        <p className="hero__role">{profile.role}</p>
        <p className="hero__description">{profile.description}</p>
        <div className="hero__actions">
          <a className="hero__primary-link" href="#projects">프로젝트 보기</a>
          {profile.resumeUrl ? (
            <a className="hero__resume-link" href={profile.resumeUrl} download>
              이력서 다운로드
            </a>
          ) : null}
        </div>
        {socialLinks.length > 0 ? (
          <nav className="hero__social-links" aria-label="소셜 링크">
            <ul>
              {socialLinks.map((link) => {
                const isExternal = link.href.startsWith('http')
                const actionLabel = link.label === 'Email' ? 'Email 보내기' : `${link.label} 보기`

                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noreferrer' : undefined}
                    >
                      {actionLabel}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null}
      </div>
      <ImageWithFallback
        className="hero__profile-image"
        src={profile.profileImage}
        alt={`${profile.name} 프로필 사진`}
        fallback="MH"
      />
    </section>
  )
}
