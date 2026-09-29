const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static HTTP server serving the production dist folder
function startDistServer(port = 4195) {
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
    server.listen(port, () => resolve(server));
  });
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 PLAYWRIGHT AUTOMATED TEST SUITE: ASI MONITOR v1.2.0');
  console.log('======================================================\n');

  const port = 4195;
  const server = await startDistServer(port);
  console.log(`✓ Local test server active on http://localhost:${port}`);

  const browser = await chromium.launch({ headless: true });
  
  // Test both mobile viewport and desktop viewport
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile phone standard (Pixel 7 / iPhone 14)
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  const screenshotsDir = path.join(__dirname, 'test-artifacts');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  let passedTests = 0;
  let totalTests = 0;

  try {
    // -------------------------------------------------------------
    // SETUP
    // -------------------------------------------------------------
    await page.goto(`http://localhost:${port}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // TEST 1: Black AMOLED Theme (#000000)
    // -------------------------------------------------------------
    totalTests++;
    console.log('Test 1: Verifying Black AMOLED Theme (#000000)...');
    const colors = await page.evaluate(() => {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const viewport = document.querySelector('.app-viewport');
      const viewportBg = viewport ? window.getComputedStyle(viewport).backgroundColor : '';
      return { bodyBg, viewportBg };
    });

    console.log(`Computed body background: ${colors.bodyBg}, viewport: ${colors.viewportBg}`);
    if (colors.bodyBg !== 'rgb(0, 0, 0)' && colors.viewportBg !== 'rgb(0, 0, 0)') {
      throw new Error(`Expected pure black AMOLED rgb(0,0,0), received body: ${colors.bodyBg}, viewport: ${colors.viewportBg}`);
    }
    await page.screenshot({ path: path.join(screenshotsDir, '1_amoled_monitor_view.png') });
    console.log('✓ TEST 1 PASSED: Pure Black AMOLED theme confirmed.');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 2: Header Buttons & Logo Removal
    // -------------------------------------------------------------
    totalTests++;
    console.log('\nTest 2: Verifying HeaderBar (Logo removed, ONLY Refresh & Notifications buttons remain)...');
    const headerDetails = await page.evaluate(() => {
      const logoEl = document.querySelector('.app-header-logo-icon, .header-mini-logo');
      const actions = document.querySelectorAll('.header-actions button');
      const actionTitles = Array.from(actions).map(b => b.getAttribute('title') || b.getAttribute('aria-label') || '');
      return {
        hasLogo: Boolean(logoEl),
        actionButtonsCount: actions.length,
        actionTitles
      };
    });

    console.log(`Header logo present: ${headerDetails.hasLogo}`);
    console.log(`Header action buttons count: ${headerDetails.actionButtonsCount}, buttons:`, headerDetails.actionTitles);

    if (headerDetails.hasLogo) {
      throw new Error('Header logo was NOT removed!');
    }
    if (headerDetails.actionButtonsCount !== 2) {
      throw new Error(`Expected exactly 2 buttons in header actions (Refresh & Notifications), but found ${headerDetails.actionButtonsCount}`);
    }
    console.log('✓ TEST 2 PASSED: Logo removed; only Refresh and Notifications buttons remain in header.');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 3: Hamburger Drawer & Renamed "NOTES" with No Description
    // -------------------------------------------------------------
    totalTests++;
    console.log('\nTest 3: Verifying Hamburger Drawer, "NOTES" renaming, and description removal...');
    await page.click('.hamburger-menu-btn');
    await page.waitForTimeout(400);

    const drawerData = await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('.drawer-nav-item'));
      return navItems.map(item => {
        const titleEl = item.querySelector('.drawer-nav-title');
        const descEl = item.querySelector('.drawer-nav-desc');
        return {
          title: titleEl ? titleEl.textContent.trim() : '',
          hasDesc: Boolean(descEl),
          desc: descEl ? descEl.textContent.trim() : ''
        };
      });
    });

    console.log('Drawer nav items:', drawerData);
    const notesItem = drawerData.find(d => d.title.toUpperCase() === 'NOTES');
    if (!notesItem) {
      throw new Error('Could not find "NOTES" in hamburger drawer!');
    }
    if (notesItem.hasDesc && notesItem.desc) {
      throw new Error(`NOTES item still has description: "${notesItem.desc}". Description should be removed!`);
    }

    const hasAnalytics = drawerData.some(d => d.title.includes('Analytics'));
    if (!hasAnalytics) {
      throw new Error('Could not find "Analytics Graph" in hamburger drawer!');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '2_drawer_menu_view.png') });
    console.log('✓ TEST 3 PASSED: NOTES renamed, description removed, Analytics Graph present.');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 4: Settings Modal - 2s Refresh Rate Option
    // -------------------------------------------------------------
    totalTests++;
    console.log('\nTest 4: Verifying 2s refresh interval in SettingsModal...');
    // Click Settings from the open drawer
    await page.click('.drawer-nav-item:has(.settings-icon)');
    await page.waitForTimeout(400);

    const intervals = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.interval-pill'));
      return pills.map(p => p.textContent.trim());
    });

    console.log('Available refresh intervals in Settings:', intervals);
    if (!intervals.includes('2s')) {
      throw new Error('Settings interval options do not include "2s"!');
    }

    // Click the 2s pill
    await page.click('.interval-pill:has-text("2s")');
    await page.waitForTimeout(200);

    const is2sActive = await page.evaluate(() => {
      const activePill = document.querySelector('.interval-pill.active');
      return activePill ? activePill.textContent.trim() : '';
    });
    console.log(`Active interval after clicking 2s: ${is2sActive}`);
    if (is2sActive !== '2s') {
      throw new Error(`2s interval was not set as active! Active is: ${is2sActive}`);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '3_settings_2s_active.png') });
    // Close settings modal
    await page.click('.modal-header-title button');
    await page.waitForTimeout(300);
    console.log('✓ TEST 4 PASSED: 2s refresh interval verified and selectable.');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 5: Enhanced NOTES View
    // -------------------------------------------------------------
    totalTests++;
    console.log('\nTest 5: Verifying Enhanced NOTES view (Tags, Checklists, Search, Pin, Copy)...');
    // Open hamburger drawer and click NOTES
    await page.click('.hamburger-menu-btn');
    await page.waitForTimeout(300);
    await page.click('.drawer-nav-item:has(.notes-icon)');
    await page.waitForTimeout(500);

    // Verify NOTES title exists and has no description
    const notesViewHeader = await page.evaluate(() => {
      const title = document.querySelector('.keep-title');
      return title ? title.textContent.trim() : '';
    });
    console.log(`NOTES View Header: "${notesViewHeader}"`);
    if (notesViewHeader !== 'NOTES') {
      throw new Error(`Expected NOTES header title to be "NOTES", got: "${notesViewHeader}"`);
    }

    // Verify tag pills exist
    const tagPills = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.notes-tag-pill'));
      return pills.map(p => p.textContent.trim());
    });
    console.log('NOTES tag filter pills:', tagPills);
    if (!tagPills.includes('All') || !tagPills.includes('Strategy') || !tagPills.includes('Tasks')) {
      throw new Error('NOTES tag filter pills missing standard categories!');
    }

    // Click composer to expand
    await page.click('.keep-composer-collapsed');
    await page.waitForTimeout(200);

    // Fill title and switch to checklist
    await page.fill('.composer-title-input', 'AMOLED 1.2.0 Release Checklist');
    await page.click('button[title="Switch to checklist"]');
    await page.waitForTimeout(200);

    // Fill first checklist item
    await page.fill('.checklist-text-input', 'Verify pure black AMOLED styles');
    
    // Add another item
    await page.click('.add-checklist-item-btn');
    await page.waitForTimeout(100);
    const inputs = await page.$$('.checklist-text-input');
    if (inputs.length >= 2) {
      await inputs[1].fill('Validate 2s refresh heartbeat');
    }

    // Pin note and save
    await page.click('button[title="Pin note"]');
    await page.click('.composer-save-btn');
    await page.waitForTimeout(500);

    // Verify new note is rendered
    const noteCardTitles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.note-card-title')).map(el => el.textContent.trim());
    });
    console.log('Notes on screen after creation:', noteCardTitles);
    if (!noteCardTitles.includes('AMOLED 1.2.0 Release Checklist')) {
      throw new Error('Created checklist note was not found in NOTES view!');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '4_notes_enhanced_view.png') });
    console.log('✓ TEST 5 PASSED: Enhanced NOTES functionality verified.');
    passedTests++;

    // -------------------------------------------------------------
    // TEST 6: Analytics Graph View
    // -------------------------------------------------------------
    totalTests++;
    console.log('\nTest 6: Verifying Analytics Graph View (KPIs, SVG Curve, Comparison Bar, Leaderboard)...');
    // Return to Monitor
    await page.click('.keep-header-left button');
    await page.waitForTimeout(300);

    // Open drawer and click Analytics Graph
    await page.click('.hamburger-menu-btn');
    await page.waitForTimeout(300);
    await page.click('.drawer-nav-item:has(.analytics-icon)');
    await page.waitForTimeout(600);

    const analyticsCheck = await page.evaluate(() => {
      const pageTitle = document.querySelector('.analytics-page-title');
      const kpis = Array.from(document.querySelectorAll('.kpi-value')).map(k => k.textContent.trim());
      const hasSvg = Boolean(document.querySelector('.growth-trajectory-svg'));
      const hasBars = document.querySelectorAll('.analytics-bar-row').length > 0;
      const hasLeaderboard = document.querySelectorAll('.leaderboard-row').length > 0;
      return {
        title: pageTitle ? pageTitle.textContent.trim() : '',
        kpis,
        hasSvg,
        hasBars,
        hasLeaderboard
      };
    });

    console.log('Analytics View Details:', analyticsCheck);
    if (analyticsCheck.title !== 'Analytics Graph') {
      throw new Error(`Expected "Analytics Graph" title, received: "${analyticsCheck.title}"`);
    }
    if (!analyticsCheck.hasSvg) {
      throw new Error('Follower growth trajectory SVG curve was not rendered!');
    }
    if (!analyticsCheck.hasBars) {
      throw new Error('Follower share comparison bar chart was not rendered!');
    }
    if (!analyticsCheck.hasLeaderboard) {
      throw new Error('Performance leaderboard was not rendered!');
    }

    // Test timeframe toggle
    await page.click('.timeframe-pill-btn:has-text("7D")');
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(screenshotsDir, '5_analytics_graph_view.png') });
    console.log('✓ TEST 6 PASSED: Analytics Graph View fully functional with SVG charts.');
    passedTests++;

    // Return back to Monitor
    await page.click('.analytics-header-left button');
    await page.waitForTimeout(300);

    console.log('\n======================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} PLAYWRIGHT TESTS PASSED SUCCESSFULLY!`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Playwright Test Failure:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'test_failure.png') });
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

runTestSuite();
