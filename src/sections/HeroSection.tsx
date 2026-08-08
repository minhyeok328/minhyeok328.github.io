import { ImageWithFallback } from '../components/ImageWithFallback'
import type { Profile } from '../types/portfolio'

interface HeroSectionProps {
  profile: Profile
}

export function HeroSection({ profile }: HeroSectionProps) {
  return (
    <section id="top" className="site-container hero" aria-labelledby="hero-heading">
      <div className="hero__content">
        <p className="hero__greeting">{profile.greeting}</p>
        <h1 id="hero-heading">{profile.name}입니다.</h1>
        <p className="hero__role">{profile.role}</p>
        <p className="hero__description">{profile.description}</p>
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
