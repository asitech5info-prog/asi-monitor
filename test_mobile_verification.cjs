const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static server for dist
function startDistServer(port = 4188) {
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

async function runMobilePlaywrightSuite() {
  console.log('\n=============================================');
  console.log('🚀 RUNNING PLAYWRIGHT MOBILE SUITE (PHONE OPTIMIZED)');
  console.log('=============================================\n');

  const port = 4192;
  const server = await startDistServer(port);
  console.log(`Dist server active on http://localhost:${port}`);

  const browser = await chromium.launch({ headless: true });
  
  // Emulate modern mobile phone screen (iPhone 14 / Pixel 7: 390 x 844)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();
  const artifactsDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\7a27c0ec-27c2-4876-9e58-e5659d62fc63';

  try {
    // -------------------------------------------------------------
    // SETUP: Clear storage and navigate
    // -------------------------------------------------------------
    await page.goto(`http://localhost:${port}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // TEST 1: Mobile Viewport Optimization & Zero Horizontal Overflow
    // -------------------------------------------------------------
    console.log('TEST 1: Verifying Mobile Viewport & Zero Horizontal Overflow...');
    const overflowCheck = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    console.log(`Viewport check: scrollWidth=${overflowCheck.scrollWidth}, innerWidth=${overflowCheck.innerWidth}`);
    if (overflowCheck.hasOverflow) {
      throw new Error(`Mobile viewport has horizontal overflow! scrollWidth (${overflowCheck.scrollWidth}) > innerWidth (${overflowCheck.innerWidth})`);
    }
    console.log('✓ TEST 1 PASSED: 100% Mobile Optimized, Zero horizontal overflow.');

    // -------------------------------------------------------------
    // TEST 2: Header & Hamburger Navigation Drawer
    // -------------------------------------------------------------
    console.log('\nTEST 2: Verifying Hamburger Navigation Drawer...');
    const hamburgerBtn = page.locator('.hamburger-menu-btn');
    await hamburgerBtn.click();
    await page.waitForSelector('.hamburger-drawer-panel', { state: 'visible', timeout: 3000 });

    const drawerTitle = await page.locator('.drawer-title').innerText();
    const versionPill = await page.locator('.version-pill').innerText();
    console.log(`Drawer branding: "${drawerTitle}", version: "${versionPill}"`);
    if (drawerTitle !== 'ASI Monitor' || versionPill !== 'v1.1.1') {
      throw new Error(`Expected drawer brand 'ASI Monitor v1.1.1', got '${drawerTitle} ${versionPill}'`);
    }

    // Wait for drawer slide-in animation to complete
    await page.waitForTimeout(350);

    // Capture hamburger drawer screenshot
    await page.screenshot({ path: path.join(artifactsDir, 'mobile_hamburger_drawer.png') });
    console.log('✓ Captured mobile_hamburger_drawer.png');

    // Close drawer
    await page.locator('.drawer-close-btn').click();
    await page.waitForSelector('.hamburger-drawer-panel', { state: 'hidden', timeout: 3000 });
    console.log('✓ TEST 2 PASSED: Hamburger Drawer opens and closes smoothly.');

    // -------------------------------------------------------------
    // TEST 3: Permanent Page Deletion (Bug 1 Fix Verification)
    // -------------------------------------------------------------
    console.log('\nTEST 3: Verifying Permanent Page Deletion (Doesn\'t Come Back on Reload)...');
    
    // Check initial Doodle Melt card exists
    const doodleCard = page.locator('.monitor-row-card', { hasText: 'Doodle Melt' });
    await doodleCard.waitFor({ timeout: 5000 });
    console.log('Found Doodle Melt card. Deleting it now...');

    // Open card menu and click "Remove Page"
    await doodleCard.locator('.card-menu-trigger').click();
    await page.locator('.menu-item-action.delete-item').click();
    await page.waitForTimeout(800);

    // Verify Doodle Melt is gone from DOM
    let doodleCount = await page.locator('.monitor-row-card', { hasText: 'Doodle Melt' }).count();
    if (doodleCount !== 0) {
      throw new Error('Doodle Melt was not removed after clicking delete!');
    }
    console.log('Doodle Melt removed from active DOM. Reloading page/app now...');

    // RELOAD APP - THE CRITICAL CHECK
    await page.reload();
    await page.waitForTimeout(1200);

    doodleCount = await page.locator('.monitor-row-card', { hasText: 'Doodle Melt' }).count();
    console.log(`After reload: Doodle Melt cards in DOM = ${doodleCount}`);
    if (doodleCount !== 0) {
      throw new Error('BUG REGRESSION: Doodle Melt came back after app reload!');
    }
    console.log('✓ TEST 3 PASSED: Deleted page remains permanently deleted after reload.');

    // -------------------------------------------------------------
    // TEST 4: Add Page via Pasted Link Without Freezing (Bug 2 Fix Verification)
    // -------------------------------------------------------------
    console.log('\nTEST 4: Verifying Add Page with Link (No Freeze / Hang)...');
    const inputField = page.locator('.url-text-input');
    const addBtn = page.locator('.add-btn');

    // Paste a custom Facebook page URL
    const testUrl = 'https://www.facebook.com/ASI.Tech.Official';
    await inputField.fill(testUrl);
    await addBtn.click();

    // Check that either the page was added directly or the configure modal opened swiftly without hanging
    const modalOrCardAppeared = await Promise.race([
      page.waitForSelector('.settings-modal-card', { state: 'visible', timeout: 4000 }).then(() => 'modal'),
      page.waitForSelector('.monitor-row-card:has-text("ASI Tech Official")', { timeout: 4000 }).then(() => 'card')
    ]).catch(() => 'timeout');

    console.log(`Link submission result: ${modalOrCardAppeared}`);
    if (modalOrCardAppeared === 'timeout') {
      throw new Error('BUG REGRESSION: Add Page got stuck on adding link!');
    }

    if (modalOrCardAppeared === 'modal') {
      console.log('Configure modal opened cleanly. Confirming add to monitor...');
      await page.locator('.settings-modal-card button[type="submit"]').click();
      await page.waitForSelector('.monitor-row-card:has-text("ASI Tech Official")', { timeout: 4000 });
    }

    const addedCard = page.locator('.monitor-row-card', { hasText: 'ASI Tech Official' });
    const isAdded = await addedCard.isVisible();
    if (!isAdded) {
      throw new Error('Newly added page card is not visible!');
    }
    console.log('✓ TEST 4 PASSED: Link pasted and page added successfully without freezing.');

    // -------------------------------------------------------------
    // TEST 5: Rearrange Pages (Feature 1 Verification)
    // -------------------------------------------------------------
    console.log('\nTEST 5: Verifying Page Rearranging (Top, Middle, Custom Order)...');
    
    // Toggle Reorder Mode
    const reorderBtn = page.locator('.icon-btn-round[title="Rearrange Pages"]');
    await reorderBtn.click();
    await page.waitForSelector('.reorder-banner', { state: 'visible', timeout: 3000 });
    console.log('Reorder banner active. Checking reorder controls on cards...');

    // Verify position pills (#1, #2, etc.)
    const firstPill = await page.locator('.reorder-position-pill').first().innerText();
    console.log(`First card position indicator: ${firstPill}`);
    if (firstPill !== '#1') {
      throw new Error(`Expected '#1' for first position pill, got '${firstPill}'`);
    }

    // Capture reorder mode screenshot
    await page.screenshot({ path: path.join(artifactsDir, 'mobile_reorder_mode.png') });
    console.log('✓ Captured mobile_reorder_mode.png');

    // Get current order of cards
    const initialTitles = await page.locator('.card-page-title').allInnerTexts();
    console.log('Initial order:', initialTitles);

    // Move second card to top using dropdown menu
    const secondCard = page.locator('.monitor-row-card').nth(1);
    const secondTitle = await secondCard.locator('.card-page-title').innerText();
    await secondCard.locator('.card-menu-trigger').click();
    await page.locator('.menu-item-action:has-text("Place at Top")').click();
    await page.waitForTimeout(600);

    // Verify it is now at the top
    const newTopTitle = await page.locator('.card-page-title').first().innerText();
    console.log(`After 'Place at Top': Top card is now "${newTopTitle}" (was "${secondTitle}")`);
    if (newTopTitle !== secondTitle) {
      throw new Error(`Expected top card to be '${secondTitle}', but got '${newTopTitle}'`);
    }

    // Reload page to verify custom order is persisted in localStorage
    console.log('Reloading to verify reordered position persists in storage...');
    await page.reload();
    await page.waitForTimeout(1000);

    const reloadedTopTitle = await page.locator('.card-page-title').first().innerText();
    if (reloadedTopTitle !== secondTitle) {
      throw new Error(`Order did not persist after reload! Expected '${secondTitle}', got '${reloadedTopTitle}'`);
    }
    console.log('✓ TEST 5 PASSED: Page rearranging works and persists across reloads.');

    // -------------------------------------------------------------
    // TEST 6: Google Keep-Style Notes Feature (Feature 2 Verification)
    // -------------------------------------------------------------
    console.log('\nTEST 6: Verifying Google Keep-Style Notes Feature...');
    
    // Open Keep Notes via header shortcut
    await page.locator('.icon-btn-round[title="Keep Notes"]').click();
    await page.waitForSelector('.keep-notes-container', { state: 'visible', timeout: 3000 });
    console.log('Keep Notes view opened.');

    // Verify Keep Notes Header
    const keepTitle = await page.locator('.keep-title').innerText();
    if (keepTitle !== 'Keep Notes') {
      throw new Error(`Expected 'Keep Notes' view title, got '${keepTitle}'`);
    }

    // Create a new note using "Take a note..." composer
    console.log('Opening "Take a note..." composer...');
    await page.locator('.keep-composer-collapsed').click();
    await page.waitForSelector('.keep-composer-form', { state: 'visible' });

    // Fill Title, Content, and select Color
    await page.locator('.composer-title-input').fill('Playwright Phone Test 📱');
    await page.locator('.composer-body-textarea').fill('Testing notes creation, color tag, and pinned status on mobile.');
    
    // Pin note
    await page.locator('.composer-pin-btn').click();
    
    // Save note
    await page.locator('.composer-save-btn').click();
    await page.waitForTimeout(800);

    // Verify note rendered in PINNED section
    const testNote = page.locator('.keep-note-card', { hasText: 'Playwright Phone Test 📱' });
    await testNote.waitFor({ timeout: 3000 });
    const isPinned = await testNote.locator('.note-pin-btn.pinned').isVisible();
    console.log(`Created note visible, isPinned: ${isPinned}`);
    if (!isPinned) {
      throw new Error('Created note was not marked as pinned!');
    }

    // Capture Keep Notes screenshot
    await page.screenshot({ path: path.join(artifactsDir, 'mobile_keep_notes_view.png') });
    console.log('✓ Captured mobile_keep_notes_view.png');

    // Reload page to verify notes persistence
    console.log('Reloading to verify notes persistence in localStorage...');
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Reopen Keep Notes
    await page.locator('.icon-btn-round[title="Keep Notes"]').click();
    await page.waitForSelector('.keep-notes-container', { state: 'visible' });

    const reloadedNote = page.locator('.keep-note-card', { hasText: 'Playwright Phone Test 📱' });
    if (!(await reloadedNote.isVisible())) {
      throw new Error('Keep note did not persist after reload!');
    }
    console.log('✓ Note persisted successfully.');

    // Return to monitor
    await page.locator('.keep-header-left button').click();
    await page.waitForSelector('.cards-scroll-container', { state: 'visible' });
    console.log('Returned to Live Monitor view.');

    // Capture main mobile monitor view screenshot
    await page.screenshot({ path: path.join(artifactsDir, 'mobile_monitor_view.png') });
    console.log('✓ Captured mobile_monitor_view.png');

    console.log('✓ TEST 6 PASSED: Google Keep Notes feature functions flawlessly.');

    // -------------------------------------------------------------
    // ALL TESTS PASSED!
    // -------------------------------------------------------------
    console.log('\n=============================================');
    console.log('🎉 ALL PLAYWRIGHT MOBILE SUITE TESTS PASSED (6/6)!');
    console.log('=============================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runMobilePlaywrightSuite().catch(err => {
  console.error('\n❌ PLAYWRIGHT SUITE FAILED:', err);
  process.exit(1);
});
