// E2E Tests pour l'authentification
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form when not authenticated', async ({ page }) => {
    // Check if login form is displayed
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for invalid inputs', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]')
    
    // Try to submit empty form
    await loginButton.click()
    
    // Check for validation errors
    await expect(page.locator('[data-testid="email-error"]')).toContainText('requis')
    await expect(page.locator('[data-testid="password-error"]')).toContainText('requis')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for error message
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(/invalide|incorrect/i)
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill form with valid test credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Check if user is authenticated
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible()
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
  })

  test('should display signup form when signup link is clicked', async ({ page }) => {
    // Click signup link
    await page.click('[data-testid="signup-link"]')
    
    // Check if signup form is displayed
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible()
    
    // Check additional signup fields
    await expect(page.locator('input[name="firstName"]')).toBeVisible()
    await expect(page.locator('input[name="lastName"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should handle signup process', async ({ page }) => {
    // Go to signup
    await page.click('[data-testid="signup-link"]')
    
    // Fill signup form
    await page.fill('input[name="firstName"]', 'John')
    await page.fill('input[name="lastName"]', 'Doe')
    await page.fill('input[type="email"]', 'john.doe@example.com')
    await page.fill('input[name="password"]', 'newpassword123')
    await page.fill('input[name="confirmPassword"]', 'newpassword123')
    
    // Submit signup form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL(/.*dashboard|.*verify/)
  })

  test('should handle password reset flow', async ({ page }) => {
    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]')
    
    // Check if reset form is displayed
    await expect(page.locator('[data-testid="reset-form"]')).toBeVisible()
    
    // Fill email for reset
    await page.fill('input[type="email"]', 'test@example.com')
    
    // Submit reset request
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="reset-success"]')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Click user avatar to open menu
    await page.click('[data-testid="user-avatar"]')
    
    // Click logout
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Reload page
    await page.reload()
    
    // Should still be authenticated
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      })
    })
    
    // Try to login
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(/erreur|server/i)
  })
})