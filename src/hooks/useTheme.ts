import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'portfolio-theme'

export type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }
  } catch {
    return 'light'
  }

  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Theme switching remains available when browser storage is unavailable.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, toggleTheme }
}
