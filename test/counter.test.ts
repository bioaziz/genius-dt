import { describe, it, expect, beforeEach } from 'vitest'
import { setupCounter } from '../src/counter'

describe('setupCounter', () => {
  let button: HTMLButtonElement

  beforeEach(() => {
    // Create a fresh button element before each test
    button = document.createElement('button')
    document.body.appendChild(button)
  })

  it('should initialize counter with 0', () => {
    setupCounter(button)
    expect(button.innerHTML).toBe('count is 0')
  })

  it('should increment counter when clicked', () => {
    setupCounter(button)
    
    // Initial state
    expect(button.innerHTML).toBe('count is 0')
    
    // Simulate a click
    button.click()
    
    // Counter should be incremented
    expect(button.innerHTML).toBe('count is 1')
    
    // Click again
    button.click()
    
    // Counter should be incremented again
    expect(button.innerHTML).toBe('count is 2')
  })
})