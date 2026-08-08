import { scrollToSection } from '../lib/sectionNavigation'

interface FooterProps {
  name: string
}

export function Footer({ name }: FooterProps) {
  return (
    <footer className="site-container site-footer">
      <p>© {new Date().getFullYear()} {name}</p>
      <button type="button" onClick={() => scrollToSection('top')}>맨 위로</button>
    </footer>
  )
}
