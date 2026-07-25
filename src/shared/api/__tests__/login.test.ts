import { consumeOAuthState } from '../login'

describe('OAuth state validation', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('accepts the matching state exactly once', () => {
    sessionStorage.setItem('seoul-fit.oauth.state', 'expected-state')

    expect(consumeOAuthState('expected-state')).toBe(true)
    expect(consumeOAuthState('expected-state')).toBe(false)
  })

  it('rejects missing or mismatched state values', () => {
    sessionStorage.setItem('seoul-fit.oauth.state', 'expected-state')
    expect(consumeOAuthState('attacker-state')).toBe(false)

    sessionStorage.setItem('seoul-fit.oauth.state', 'expected-state')
    expect(consumeOAuthState()).toBe(false)
  })
})
