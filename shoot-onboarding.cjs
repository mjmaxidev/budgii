const puppeteer = require('puppeteer');
const path = require('path');

const clickByText = async (page, text) => {
  await page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim().includes(t));
    if (el) el.click();
  }, text);
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const dir = path.join(__dirname, 'screenshots');

  // Step 1
  await page.goto('http://localhost:5173/#/onboarding', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(dir, 'OB1.png') });

  // -> Step 2 (email)
  await page.type('input[placeholder*="Email"]', 'mia@example.com');
  await clickByText(page, 'Continue');
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: path.join(dir, 'OB2.png') });

  // fill OTP -> Step 3
  const otp = await page.$$('input[inputmode="numeric"]');
  if (otp[0]) { await otp[0].click(); await page.keyboard.type('123456'); }
  await new Promise(r => setTimeout(r, 400));
  await clickByText(page, 'Verify and continue');
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: path.join(dir, 'OB3.png') });

  // fill name -> Step 4
  await page.type('input[placeholder="Enter your name"]', 'Mia');
  await new Promise(r => setTimeout(r, 200));
  await clickByText(page, 'Continue');
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: path.join(dir, 'OB4.png') });

  await browser.close();
  console.log('shot OB1-OB4');
})().catch(e => { console.error(e); process.exit(1); });
