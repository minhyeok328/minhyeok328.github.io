import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextThemeLabel = theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={nextThemeLabel}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
    >
      <span aria-hidden="true">{theme === 'light' ? '◐' : '◑'}</span>
    </button>
  )
}
