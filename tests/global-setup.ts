// Global setup for Playwright tests
import { chromium } from '@playwright/test'

async function globalSetup() {
  console.log('🚀 Setting up test environment...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Setup test data in localStorage/sessionStorage if needed
    await page.goto('http://localhost:5173')
    
    // Set up test user data
    await page.evaluate(() => {
      // Mock user preferences
      localStorage.setItem('user_preferences', JSON.stringify({
        theme: 'light',
        language: 'fr',
        pushNotifications: {
          enabled: false,
          preferences: {
            chat: true,
            deadlines: true,
            mentions: true,
            gamification: true,
            reviews: true
          }
        }
      }))
      
      // Mock game statistics
      localStorage.setItem('game_statistics', JSON.stringify({
        rapidWord: {
          gamesPlayed: 5,
          totalScore: 450,
          bestScore: 95,
          averageTime: 45.2
        },
        dodgeClick: {
          gamesPlayed: 3,
          totalScore: 180,
          bestScore: 65,
          averageAccuracy: 0.78
        },
        flashMath: {
          gamesPlayed: 8,
          totalScore: 680,
          bestScore: 92,
          averageTime: 12.5
        }
      }))
      
      // Mock auth token for tests (if using localStorage for auth)
      localStorage.setItem('auth_token', 'test-jwt-token')
    })
    
    console.log('✅ Test environment setup complete')
    
  } catch (error) {
    console.error('❌ Error setting up test environment:', error)
  } finally {
    await browser.close()
  }
}

export default globalSetup