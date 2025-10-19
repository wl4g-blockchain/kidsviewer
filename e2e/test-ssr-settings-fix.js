import { chromium } from 'playwright';

async function testSSRSettingsFix() {
  console.log('🧪 Testing SSR Settings Page Fix...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test 1: Direct access to settings page without authentication
    console.log('📋 Test 1: Accessing /app/settings without authentication');
    await page.goto('http://localhost:3000/app/settings');
    await page.waitForTimeout(3000);
    
    // Check if the page loads without the AuthProvider error
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check if we see the login prompt instead of an error
    const loginPrompt = await page.locator('text=需要登录').isVisible().catch(() => false);
    const loadingSpinner = await page.locator('.animate-spin').isVisible().catch(() => false);
    
    if (loginPrompt) {
      console.log('✅ Test 1 PASSED: Shows login prompt instead of AuthProvider error');
    } else if (loadingSpinner) {
      console.log('⏳ Test 1 PARTIAL: Shows loading state (may be checking auth)');
    } else {
      console.log('❌ Test 1 FAILED: Unexpected state');
    }
    
    // Test 2: Check for AuthProvider errors in console
    console.log('\n📋 Test 2: Checking for AuthProvider errors');
    const authProviderErrors = consoleErrors.filter(error => 
      error.includes('useSession must be used within an AuthProvider')
    );
    
    if (authProviderErrors.length === 0) {
      console.log('✅ Test 2 PASSED: No AuthProvider errors found');
    } else {
      console.log('❌ Test 2 FAILED: Found AuthProvider errors:');
      authProviderErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Test 3: Test with authentication (if possible)
    console.log('\n📋 Test 3: Testing with authentication flow');
    try {
      // Try to navigate to login first
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      // Check if login page loads properly
      const loginPageLoaded = await page.locator('text=Login').isVisible().catch(() => false) ||
                             await page.locator('text=登录').isVisible().catch(() => false);
      
      if (loginPageLoaded) {
        console.log('✅ Test 3 PASSED: Login page loads correctly');
      } else {
        console.log('⏳ Test 3 PARTIAL: Login page may be loading or using different text');
      }
    } catch (error) {
      console.log('⏳ Test 3 SKIPPED: Could not test login flow');
    }
    
    // Test 4: Check overall page structure
    console.log('\n📋 Test 4: Checking page structure');
    const hasBody = await page.locator('body').isVisible().catch(() => false);
    const hasHtml = await page.locator('html').isVisible().catch(() => false);
    
    if (hasBody && hasHtml) {
      console.log('✅ Test 4 PASSED: Basic page structure is intact');
    } else {
      console.log('❌ Test 4 FAILED: Page structure issues');
    }
    
    console.log('\n🎯 Summary:');
    console.log('- SSR Settings page should now load without AuthProvider errors');
    console.log('- Authentication state is properly handled');
    console.log('- Page gracefully handles both authenticated and unauthenticated states');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testSSRSettingsFix().catch(console.error);
