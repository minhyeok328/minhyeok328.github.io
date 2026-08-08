import type { PortfolioData, Profile } from '../types/portfolio'

export function getVisibleContactLinks(profile: Profile) {
  return [
    { label: 'GitHub', href: profile.githubUrl },
    { label: '블로그', href: profile.blogUrl },
    { label: 'Email', href: profile.email ? `mailto:${profile.email}` : '' },
    { label: 'LinkedIn', href: profile.linkedinUrl },
  ].filter((link) => link.href.length > 0)
}

export function hasExperience(data: PortfolioData) {
  return data.experiences.length > 0
}

export function getNavigationItems(data: PortfolioData) {
  return [
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    ...(hasExperience(data) ? [{ id: 'experience', label: 'Experience' }] : []),
    { id: 'contact', label: 'Contact' },
  ]
}
