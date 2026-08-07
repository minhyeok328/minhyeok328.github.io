import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { ContactSection } from './ContactSection'

describe('ContactSection', () => {
  it('renders the verified links in order with protocol-appropriate attributes', () => {
    render(<ContactSection profile={portfolioData.profile} />)

    const contact = screen.getByRole('region', { name: 'Contact' })
    const links = within(contact).getAllByRole('link')

    expect(links.map((link) => link.textContent)).toEqual([
      'GitHub 보기',
      '블로그 보기',
      'Email 보내기',
    ])
    expect(links[0]).toHaveAttribute('href', 'https://github.com/minhyeok328')
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noreferrer')
    expect(links[1]).toHaveAttribute('href', 'https://minhyeok328.tistory.com/')
    expect(links[1]).toHaveAttribute('target', '_blank')
    expect(links[1]).toHaveAttribute('rel', 'noreferrer')
    expect(links[2]).toHaveAttribute('href', 'mailto:tjalsgur328@gmail.com')
    expect(links[2]).not.toHaveAttribute('target')
    expect(links[2]).not.toHaveAttribute('rel')
    expect(within(contact).queryByRole('link', { name: 'LinkedIn 보기' })).not.toBeInTheDocument()
  })
})
