import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Footer } from './Footer'

describe('Footer', () => {
  it('renders the return-to-top control as a native button', () => {
    render(<Footer name="Minhyeok" />)

    expect(screen.getByRole('button', { name: /맨 위로/ })).toBeVisible()
  })
})
