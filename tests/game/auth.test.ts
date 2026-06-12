import { describe, it, expect } from 'vitest'
import { createGameToken, verifyGameToken } from '@/lib/game/auth'

const SECRET = 'test-secret'
const USER = '11111111-2222-3333-4444-555555555555'
const OTHER = '99999999-8888-7777-6666-555555555555'

describe('game token', () => {
  it('round-trips a valid signed token', () => {
    const token = createGameToken(USER, SECRET)
    expect(token.startsWith('sso.v2.')).toBe(true) // must keep sso. prefix for middleware
    expect(verifyGameToken(token, SECRET)).toBe(USER)
  })

  it('rejects a token whose userId was swapped', () => {
    const token = createGameToken(USER, SECRET)
    const forged = token.replace(USER, OTHER)
    expect(verifyGameToken(forged, SECRET)).toBeNull()
  })

  it('rejects a token signed with a different secret', () => {
    const token = createGameToken(USER, 'other-secret')
    expect(verifyGameToken(token, SECRET)).toBeNull()
  })

  it('rejects an expired token', () => {
    const token = createGameToken(USER, SECRET, 1000)
    expect(verifyGameToken(token, SECRET, Date.now() + 60_000)).toBeNull()
  })

  it('rejects legacy unsigned cookie formats', () => {
    expect(verifyGameToken(`sso.${USER}.1718000000000.deadbeef`, SECRET)).toBeNull()
    expect(verifyGameToken(`sso.${USER}.somebasetoken`, SECRET)).toBeNull()
    expect(verifyGameToken('sso.1718000000000.valid', SECRET)).toBeNull()
  })

  it('rejects garbage and tampered signatures', () => {
    expect(verifyGameToken('', SECRET)).toBeNull()
    expect(verifyGameToken('sso.v2.not-a-uuid.123.abc', SECRET)).toBeNull()
    const token = createGameToken(USER, SECRET)
    expect(verifyGameToken(token.slice(0, -4) + '0000', SECRET)).toBeNull()
    expect(verifyGameToken(token.replace(/\.[0-9a-f]+$/, '.'), SECRET)).toBeNull() // empty sig
  })
})
