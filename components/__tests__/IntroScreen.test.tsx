import React from 'react'
import { render, screen } from '@testing-library/react'
import IntroScreen from '../IntroScreen'

describe('IntroScreen', () => {
  it('renders intro screen with welcome message', () => {
    render(<IntroScreen exiting={false} />)

    expect(screen.getByText(/Mission Market/i)).toBeInTheDocument()
    expect(screen.getByText(/gain the most credits/i)).toBeInTheDocument()
    expect(screen.getByText(/Waiting for the facilitator to begin/i)).toBeInTheDocument()
  })
})
