// Global teardown for Playwright tests
async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...')
  
  // Clean up any test data, close connections, etc.
  // For Firebase: you might want to clean test collections
  // For files: remove any temporary test files
  
  console.log('✅ Test environment cleanup complete')
}

export default globalTeardown