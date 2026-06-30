const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pages = [
  { name: 'Home', path: '#/home' },
  { name: 'Login', path: '#/login' },
  { name: 'Verification', path: '#/verification' },
  { name: 'OnBoarding', path: '#/onboarding' },
  { name: 'Transactions', path: '#/transactions' },
  { name: 'AddExpense', path: '#/add-expense' },
  { name: 'ScanReceipt', path: '#/scan-receipt' },
  { name: 'Reports', path: '#/reports' },
  { name: 'SpendingBreakdown', path: '#/spending-breakdown' },
  { name: 'BudgetSetup', path: '#/budget-setup' },
  { name: 'BudgetComparison', path: '#/budget-comparison' },
  { name: 'CategoriesTags', path: '#/categories-tags' },
  { name: 'DealWatchlist', path: '#/deal-watchlist' },
  { name: 'DealCards', path: '#/deal-cards' },
  { name: 'ShoppingList', path: '#/shopping-list' },
  { name: 'Profile', path: '#/profile' },
  { name: 'Settings', path: '#/settings' },
  { name: 'FamilyMembers', path: '#/family-members' },
  { name: 'Notifications', path: '#/notifications' },
  { name: 'Help', path: '#/help' },
];

async function captureScreenshots() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const screenshotDir = path.join(__dirname, 'screenshots');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log(`📸 Starting screenshot capture...\n`);

  for (const page of pages) {
    try {
      const browserPage = await browser.newPage();

      // Set exact phone viewport
      await browserPage.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 1
      });

      const url = `http://localhost:5173${page.path}`;
      console.log(`⏳ ${page.name}...`);

      // Navigate with better wait condition
      await browserPage.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      // Wait for images and content to load
      await browserPage.waitForFunction(
        () => document.readyState === 'complete',
        { timeout: 8000 }
      ).catch(() => {});

      // Additional render delay
      await new Promise(r => setTimeout(r, 1000));

      const filename = `${page.name}.png`;
      const filepath = path.join(screenshotDir, filename);

      // Full page screenshot
      await browserPage.screenshot({
        path: filepath,
        fullPage: false,
        omitBackground: false
      });

      console.log(`   ✅ ${filename}`);
      await browserPage.close();
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\n🎉 Screenshot capture complete!`);
  console.log(`📁 Saved to: ${screenshotDir}`);
}

captureScreenshots().catch(console.error);
