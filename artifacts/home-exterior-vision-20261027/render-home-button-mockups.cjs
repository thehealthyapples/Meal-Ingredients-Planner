const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 780 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(root, 'HOME_BUTTON_PLACEMENT_MOCKUPS.html').replace(/\\/g, '/'));
  await page.waitForTimeout(1200);
  for (const id of ['mockup-a', 'mockup-b', 'mockup-c']) {
    const element = page.locator('#' + id);
    await element.screenshot({ path: path.join(root, id + '.png') });
  }
  await page.screenshot({ path: path.join(root, 'HOME_BUTTON_PLACEMENT_CONTACT.png'), fullPage: true });
  await browser.close();
})();
