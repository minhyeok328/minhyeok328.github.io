import { useEffect, useRef, useState } from 'react'
import { scrollToSection } from '../lib/sectionNavigation'
import { ThemeToggle } from './ThemeToggle'

export interface NavigationItem {
  id: string
  label: string
}

interface HeaderProps {
  items: NavigationItem[]
  activeSection: string
}

function NavigationLinks({ items, activeSection, onNavigate }: {
  items: NavigationItem[]
  activeSection: string
  onNavigate: (sectionId: string) => void
}) {
  return (
    <ul className="header__navigation-list">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            aria-current={item.id === activeSection ? 'location' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  )
}

export function Header({ items, activeSection }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointerDown)
  }, [isMenuOpen])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined
    }

    const desktopMediaQuery = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false)
      }
    }

    desktopMediaQuery.addEventListener?.('change', closeOnDesktop)
    desktopMediaQuery.addListener?.(closeOnDesktop)

    return () => {
      desktopMediaQuery.removeEventListener?.('change', closeOnDesktop)
      desktopMediaQuery.removeListener?.(closeOnDesktop)
    }
  }, [])

  return (
    <header ref={headerRef} className="site-header">
      <div className="site-container site-header__inner">
        <button type="button" className="header__brand" onClick={() => scrollToSection('top')}>MH</button>

        <nav className="header__desktop-navigation" aria-label="기본 탐색">
          <NavigationLinks items={items} activeSection={activeSection} onNavigate={scrollToSection} />
        </nav>

        <div className="header__actions">
          <ThemeToggle />
          <button
            type="button"
            className="header__menu-button"
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>

        <nav
          id="mobile-navigation"
          className="header__mobile-navigation"
          aria-label="모바일 탐색"
          hidden={!isMenuOpen}
        >
          <NavigationLinks
            items={items}
            activeSection={activeSection}
            onNavigate={(sectionId) => {
              scrollToSection(sectionId)
              setIsMenuOpen(false)
            }}
          />
        </nav>
      </div>
    </header>
  )
}
