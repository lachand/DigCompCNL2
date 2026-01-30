// E2E Tests pour les jeux
import { test, expect } from '@playwright/test'

test.describe('Mini-Games System', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (assuming we have a test user)
    await page.goto('/')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Navigate to games
    await page.click('[data-testid="sidebar-games"]')
    await expect(page).toHaveURL(/.*games/)
  })

  test('should display games menu with all available games', async ({ page }) => {
    // Check games menu is visible
    await expect(page.locator('[data-testid="games-menu"]')).toBeVisible()
    
    // Check all games are present
    await expect(page.locator('[data-testid="game-rapidword"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-dodgeclick"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-flashmath"]')).toBeVisible()
    await expect(page.locator('[data-testid="global-leaderboard"]')).toBeVisible()
  })

  test('should play Rapid Word Game successfully', async ({ page }) => {
    // Start Rapid Word Game
    await page.click('[data-testid="game-rapidword"]')
    
    // Wait for game to load
    await expect(page.locator('[data-testid="rapidword-game"]')).toBeVisible()
    await expect(page.locator('[data-testid="word-display"]')).toBeVisible()
    
    // Start game
    await page.click('[data-testid="start-game-btn"]')
    
    // Wait for first word
    await expect(page.locator('[data-testid="current-word"]')).toBeVisible()
    
    // Get the word to type
    const wordElement = page.locator('[data-testid="current-word"]')
    const wordText = await wordElement.textContent()
    
    if (wordText) {
      // Type the word
      await page.fill('[data-testid="word-input"]', wordText)
      await page.press('[data-testid="word-input"]', 'Enter')
      
      // Wait for next word or completion
      await page.waitForTimeout(500)
    }
    
    // Continue playing for a few words
    for (let i = 0; i < 3; i++) {
      const currentWord = await page.locator('[data-testid="current-word"]').textContent()
      if (currentWord) {
        await page.fill('[data-testid="word-input"]', currentWord)
        await page.press('[data-testid="word-input"]', 'Enter')
        await page.waitForTimeout(100)
      }
    }
    
    // Game should eventually complete and show results
    await expect(page.locator('[data-testid="game-results"]')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible()
  })

  test('should play Dodge & Click Game successfully', async ({ page }) => {
    // Start Dodge & Click Game
    await page.click('[data-testid="game-dodgeclick"]')
    
    // Wait for game to load
    await expect(page.locator('[data-testid="dodgeclick-game"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-arena"]')).toBeVisible()
    
    // Start game
    await page.click('[data-testid="start-game-btn"]')
    
    // Wait for targets to appear
    await page.waitForTimeout(1000)
    
    // Click on some targets
    for (let i = 0; i < 5; i++) {
      const targets = page.locator('[data-testid="target"]')
      const count = await targets.count()
      
      if (count > 0) {
        // Click on the first target
        await targets.first().click()
        await page.waitForTimeout(200)
      }
    }
    
    // Wait for game to end
    await page.waitForTimeout(10000) // Game duration
    
    // Check results
    await expect(page.locator('[data-testid="game-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible()
  })

  test('should play Flash Math Game successfully', async ({ page }) => {
    // Start Flash Math Game
    await page.click('[data-testid="game-flashmath"]')
    
    // Wait for game to load
    await expect(page.locator('[data-testid="flashmath-game"]')).toBeVisible()
    
    // Select difficulty
    await page.click('[data-testid="difficulty-easy"]')
    
    // Start game
    await page.click('[data-testid="start-game-btn"]')
    
    // Wait for first problem
    await expect(page.locator('[data-testid="math-problem"]')).toBeVisible()
    
    // Solve a few problems
    for (let i = 0; i < 5; i++) {
      const problem = await page.locator('[data-testid="math-problem"]').textContent()
      
      if (problem) {
        // Simple calculation (this is a test, so we'll use eval for demo)
        // In real tests, you'd have proper calculation logic
        const answer = eval(problem.replace('=', '').replace('?', ''))
        
        await page.fill('[data-testid="answer-input"]', answer.toString())
        await page.press('[data-testid="answer-input"]', 'Enter')
        await page.waitForTimeout(100)
      }
      
      // Break if game ended
      const gameEnded = await page.locator('[data-testid="game-results"]').isVisible()
      if (gameEnded) break
    }
    
    // Wait for game to end naturally if not already ended
    await expect(page.locator('[data-testid="game-results"]')).toBeVisible({ timeout: 30000 })
  })

  test('should display and update leaderboard', async ({ page }) => {
    // Go to leaderboard
    await page.click('[data-testid="global-leaderboard"]')
    
    // Check leaderboard is visible
    await expect(page.locator('[data-testid="leaderboard-container"]')).toBeVisible()
    
    // Check tabs for different games
    await expect(page.locator('[data-testid="tab-rapidword"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-dodgeclick"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-flashmath"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-overall"]')).toBeVisible()
    
    // Switch between tabs
    await page.click('[data-testid="tab-rapidword"]')
    await expect(page.locator('[data-testid="rapidword-leaderboard"]')).toBeVisible()
    
    await page.click('[data-testid="tab-overall"]')
    await expect(page.locator('[data-testid="overall-leaderboard"]')).toBeVisible()
    
    // Check if personal stats are shown
    await expect(page.locator('[data-testid="personal-stats"]')).toBeVisible()
  })

  test('should save game statistics locally', async ({ page }) => {
    // Play a quick game
    await page.click('[data-testid="game-rapidword"]')
    await page.click('[data-testid="start-game-btn"]')
    
    // Complete one word quickly
    const word = await page.locator('[data-testid="current-word"]').textContent()
    if (word) {
      await page.fill('[data-testid="word-input"]', word)
      await page.press('[data-testid="word-input"]', 'Enter')
    }
    
    // Let game complete
    await expect(page.locator('[data-testid="game-results"]')).toBeVisible({ timeout: 30000 })
    
    // Go back to menu
    await page.click('[data-testid="back-to-menu"]')
    
    // Go to leaderboard
    await page.click('[data-testid="global-leaderboard"]')
    
    // Check that personal stats updated
    await expect(page.locator('[data-testid="personal-stats"]')).toBeVisible()
    const gamesPlayed = page.locator('[data-testid="games-played-count"]')
    await expect(gamesPlayed).not.toHaveText('0')
  })

  test('should handle game navigation correctly', async ({ page }) => {
    // Start a game
    await page.click('[data-testid="game-rapidword"]')
    await expect(page.locator('[data-testid="rapidword-game"]')).toBeVisible()
    
    // Go back to menu
    await page.click('[data-testid="back-to-menu"]')
    await expect(page.locator('[data-testid="games-menu"]')).toBeVisible()
    
    // Start another game
    await page.click('[data-testid="game-flashmath"]')
    await expect(page.locator('[data-testid="flashmath-game"]')).toBeVisible()
    
    // Navigate using breadcrumb
    await page.click('[data-testid="breadcrumb-games"]')
    await expect(page.locator('[data-testid="games-menu"]')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check games menu is mobile-friendly
    await expect(page.locator('[data-testid="games-menu"]')).toBeVisible()
    
    // Games should be stacked vertically on mobile
    const gameCards = page.locator('[data-testid^="game-"]')
    const firstCard = gameCards.first()
    const secondCard = gameCards.nth(1)
    
    const firstRect = await firstCard.boundingBox()
    const secondRect = await secondCard.boundingBox()
    
    // Second card should be below first card (not side by side)
    expect(secondRect?.y).toBeGreaterThan(firstRect?.y || 0)
  })

  test('should handle game interruption gracefully', async ({ page }) => {
    // Start a game
    await page.click('[data-testid="game-rapidword"]')
    await page.click('[data-testid="start-game-btn"]')
    
    // Wait for game to start
    await expect(page.locator('[data-testid="current-word"]')).toBeVisible()
    
    // Navigate away from the game
    await page.click('[data-testid="sidebar-dashboard"]')
    
    // Navigate back to games
    await page.click('[data-testid="sidebar-games"]')
    
    // Should be back at games menu (not in the middle of a game)
    await expect(page.locator('[data-testid="games-menu"]')).toBeVisible()
  })
})