import { describe, it, expect } from 'vitest'
import { hashEmail, getUserColor, formatDate } from '@/utils/helpers'

describe('helpers', () => {
  describe('hashEmail', () => {
    it('should hash an email to a number', () => {
      const hash = hashEmail('test@example.com')
      expect(typeof hash).toBe('number')
      expect(hash).toBeGreaterThanOrEqual(0)
    })

    it('should return the same hash for the same email', () => {
      const hash1 = hashEmail('test@example.com')
      const hash2 = hashEmail('test@example.com')
      expect(hash1).toBe(hash2)
    })

    it('should return different hashes for different emails', () => {
      const hash1 = hashEmail('test1@example.com')
      const hash2 = hashEmail('test2@example.com')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('getUserColor', () => {
    it('should return a color hex code', () => {
      const color = getUserColor('test@example.com')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should return the same color for the same email', () => {
      const color1 = getUserColor('test@example.com')
      const color2 = getUserColor('test@example.com')
      expect(color1).toBe(color2)
    })
  })

  describe('formatDate', () => {
    it('should format recent timestamp as "À l\'instant"', () => {
      const now = Date.now()
      const formatted = formatDate(now - 10000) // 10 seconds ago
      expect(formatted).toBe('À l\'instant')
    })

    it('should format timestamp in minutes', () => {
      const now = Date.now()
      const formatted = formatDate(now - 5 * 60 * 1000) // 5 minutes ago
      expect(formatted).toBe('il y a 5min')
    })

    it('should format timestamp in hours', () => {
      const now = Date.now()
      const formatted = formatDate(now - 2 * 60 * 60 * 1000) // 2 hours ago
      expect(formatted).toBe('il y a 2h')
    })

    it('should format timestamp in days', () => {
      const now = Date.now()
      const formatted = formatDate(now - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      expect(formatted).toBe('il y a 3j')
    })

    it('should format old timestamp as date', () => {
      const now = Date.now()
      const formatted = formatDate(now - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })
  })
})
