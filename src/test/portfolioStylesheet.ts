/// <reference types="node" />

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function readPortfolioStylesheet() {
  const stylesheet = await readFile(resolve(process.cwd(), 'src/index.css'), 'utf8')
  return stylesheet.replace('@import "tailwindcss";', '')
}

export function installPortfolioStylesheet(stylesheet: string) {
  const style = document.createElement('style')
  style.textContent = stylesheet
  document.head.append(style)

  // JSDOM does not apply focus-visible or focus-within in computed styles.
  // Mirror those states with test-only attributes so this test can exercise
  // the installed stylesheet's declarations through real focus events.
  const stateStyle = document.createElement('style')
  stateStyle.textContent = stylesheet
    .replaceAll(':focus-visible', '[data-portfolio-test-focus-visible]')
    .replaceAll(':focus-within', '[data-portfolio-test-focus-within]')
  document.head.append(stateStyle)

  const applyFocusState = (event: FocusEvent) => {
    if (!(event.target instanceof Element)) return

    event.target.setAttribute('data-portfolio-test-focus-visible', '')
    for (let element: Element | null = event.target; element; element = element.parentElement) {
      element.setAttribute('data-portfolio-test-focus-within', '')
    }
  }

  document.addEventListener('focusin', applyFocusState)

  return () => {
    document.removeEventListener('focusin', applyFocusState)
    document.querySelectorAll('[data-portfolio-test-focus-visible], [data-portfolio-test-focus-within]').forEach((element) => {
      element.removeAttribute('data-portfolio-test-focus-visible')
      element.removeAttribute('data-portfolio-test-focus-within')
    })
    stateStyle.remove()
    style.remove()
  }
}
