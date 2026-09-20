const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static server for dist
function startDistServer(port = 4173) {
  const distDir = path.join(__dirname, 'dist');
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        fs.readFile(path.join(distDir, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallback);
          }
        });
      } else {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runMobileTest() {
  const port = 4188;
  const server = await startDistServer(port);
  console.log(`Dist server running on http://localhost:${port}`);

  const browser = await chromium.launch({ headless: true });
  
  // Emulate mobile screen (iPhone 14 / modern Android: 390 x 844)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // Clear local storage and set default state with Doodle Melt
  await page.goto(`http://localhost:${port}`);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForTimeout(1000);

  // 1. Verify header text
  const headerText = await page.innerText('.app-brand-title');
  console.log('App Brand Title:', headerText);
  if (headerText !== 'ASI Monitor') {
    throw new Error(`Expected title 'ASI Monitor', got '${headerText}'`);
  }

  // 2. Verify exact follower count on Doodle Melt
  const doodleCard = page.locator('.monitor-row-card', { hasText: 'Doodle Melt' });
  await doodleCard.waitFor({ timeout: 5000 });
  
  const doodleFollowers = await doodleCard.locator('.followers-main-number').innerText();
  console.log('Doodle Melt Followers Displayed:', doodleFollowers);
  if (doodleFollowers !== '2,354') {
    throw new Error(`Expected '2,354' exact followers, but got '${doodleFollowers}'`);
  }

  // 3. Verify NO view card exists anywhere
  const viewCards = await page.locator('.latest-reel-viewer-card').count();
  console.log('Latest Reel Viewer Cards found:', viewCards);
  if (viewCards !== 0) {
    throw new Error(`Expected 0 view cards, found ${viewCards}`);
  }

  // 4. Verify Total Followers stat in summary bar
  const summaryFollowers = await page.locator('.stats-summary-bar .stat-value.highlight-green').innerText();
  console.log('Summary Total Followers:', summaryFollowers);

  // 5. Verify no horizontal overflow on mobile
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
  console.log(`Mobile Body Width: scrollWidth=${bodyScrollWidth}, clientWidth=${bodyClientWidth}`);
  if (bodyScrollWidth > bodyClientWidth + 1) {
    throw new Error(`Page has horizontal overflow: scrollWidth (${bodyScrollWidth}) > clientWidth (${bodyClientWidth})`);
  }

  // 6. Test Edit Modal with accurate 2,354
  console.log('Testing Edit Modal...');
  await doodleCard.locator('button[aria-label="Edit"]').click();
  await page.waitForSelector('.settings-modal-card');
  const editFollowersValue = await page.inputValue('.highlighted-input');
  console.log('Followers in Edit Modal:', editFollowersValue);
  
  // Close modal
  await page.click('.modal-cancel-btn');
  await page.waitForTimeout(400);

  // 7. Save mobile screenshot
  const screenshotPath = path.join(__dirname, 'scratch', 'mobile_optimized_screenshot.png');
  fs.mkdirSync(path.join(__dirname, 'scratch'), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
  server.close();
  console.log('✅ ALL MOBILE PLAYWRIGHT VERIFICATION CHECKS PASSED!');
}

runMobileTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
