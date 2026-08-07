import { getVisibleContactLinks } from '../lib/portfolio'
import type { Profile } from '../types/portfolio'

interface ContactSectionProps {
  profile: Profile
}

function getActionLabel(label: string) {
  return label === 'Email' ? 'Email 보내기' : `${label} 보기`
}

export function ContactSection({ profile }: ContactSectionProps) {
  const socialLinks = getVisibleContactLinks(profile)

  if (socialLinks.length === 0) {
    return null
  }

  return (
    <section id="contact" className="site-container portfolio-section contact-section" aria-labelledby="contact-heading">
      <h2 id="contact-heading">Contact</h2>
      <ul className="contact-section__links">
        {socialLinks.map((link) => {
          const isExternal = link.href.startsWith('http')

          return (
            <li key={link.label}>
              <a
                href={link.href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noreferrer' : undefined}
              >
                {getActionLabel(link.label)}
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
