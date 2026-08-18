import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { portfolioData } from '../data/portfolio'
import { ContactSection } from './ContactSection'

describe('ContactSection', () => {
  it('renders the verified links in order with protocol-appropriate attributes', () => {
    render(<ContactSection profile={portfolioData.profile} />)

    const contact = screen.getByRole('region', { name: 'Contact' })
    const links = within(contact).getAllByRole('link')

    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAccessibleName('GitHub 보기')
    expect(links[1]).toHaveAccessibleName('블로그 보기')
    expect(links[2]).toHaveAccessibleName('Email 보내기')

    links.forEach((link) => {
      expect(link).toHaveTextContent('')
      expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    })
    expect(links[0]).toHaveAttribute('href', 'https://github.com/minhyeok328')
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noreferrer')
    expect(links[1]).toHaveAttribute('href', 'https://blog.naver.com/m______yuk')
    expect(links[1]).toHaveAttribute('target', '_blank')
    expect(links[1]).toHaveAttribute('rel', 'noreferrer')
    expect(links[2]).toHaveAttribute('href', 'mailto:tjalsgur328@gmail.com')
    expect(links[2]).not.toHaveAttribute('target')
    expect(links[2]).not.toHaveAttribute('rel')
    expect(within(contact).queryByRole('link', { name: 'LinkedIn 보기' })).not.toBeInTheDocument()
  })

  it('renders a decorative fallback icon for LinkedIn', () => {
    render(<ContactSection profile={{ ...portfolioData.profile, linkedinUrl: 'https://www.linkedin.com/in/example' }} />)

    const linkedIn = screen.getByRole('link', { name: 'LinkedIn 보기' })

    expect(linkedIn.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })
})
