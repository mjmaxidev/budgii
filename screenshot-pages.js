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

  // Create screenshots directory
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log(`📸 Starting screenshot capture...`);
  console.log(`📁 Saving to: ${screenshotDir}\n`);

  for (const page of pages) {
    try {
      const browserPage = await browser.newPage();
      await browserPage.setViewport({ width: 390, height: 844 });

      const url = `http://localhost:5173${page.path}`;
      console.log(`⏳ Capturing ${page.name}... (${url})`);

      await browserPage.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });

      // Small delay for render
      await new Promise(r => setTimeout(r, 500));

      const filename = `${page.name}.png`;
      const filepath = path.join(screenshotDir, filename);
      await browserPage.screenshot({ path: filepath });

      console.log(`✅ ${filename}\n`);
      await browserPage.close();
    } catch (err) {
      console.log(`❌ ${page.name} failed: ${err.message}\n`);
    }
  }

  await browser.close();
  console.log(`\n🎉 Screenshot capture complete!`);
  console.log(`📁 All screenshots saved to: ${screenshotDir}`);
  return screenshotDir;
}

captureScreenshots().catch(console.error);
