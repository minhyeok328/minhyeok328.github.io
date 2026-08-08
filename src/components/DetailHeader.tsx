import { Link } from 'react-router'
import { ThemeToggle } from './ThemeToggle'

interface DetailHeaderProps {
  githubUrl: string
}

export function DetailHeader({ githubUrl }: DetailHeaderProps) {
  return (
    <header className="site-header detail-header">
      <div className="site-container site-header__inner detail-header__inner">
        <Link className="header__brand" to="/">MH</Link>

        <nav className="detail-header__navigation" aria-label="상세 페이지 탐색">
          <ul className="header__navigation-list">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/#projects">Projects</Link></li>
            <li><a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a></li>
          </ul>
        </nav>

        <div className="header__actions"><ThemeToggle /></div>
      </div>
    </header>
  )
}
