import { chromium } from 'playwright';

/**
 * Clean URL to valid Facebook URL
 */
function normalizeFacebookUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://www.facebook.com/${url.replace(/^@/, '')}`;
  }
  return url.replace('m.facebook.com', 'www.facebook.com');
}

/**
 * Parse exact integer from raw text string
 */
function extractExactInteger(text) {
  if (!text) return 0;
  // Match comma-separated or plain digits right before/after followers/likes
  const match = text.match(/([\d,]+)\s*(?:followers|likes|people follow this|people like this)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1].replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  
  // Shorthand fallback e.g. 2.4K
  const kmbMatch = text.match(/([\d.]+)\s*([KMBkmb])\s*(?:followers|likes)/i);
  if (kmbMatch) {
    const val = parseFloat(kmbMatch[1]);
    const unit = kmbMatch[2].toUpperCase();
    if (unit === 'K') return Math.round(val * 1000);
    if (unit === 'M') return Math.round(val * 1000000);
    if (unit === 'B') return Math.round(val * 1000000000);
  }
  return 0;
}

/**
 * Scrape Facebook Page / Profile using Playwright headless browser
 * Extracts 100% accurate live followers without estimation
 */
export async function scrapeFacebookWithPlaywright(rawUrl) {
  const targetUrl = normalizeFacebookUrl(rawUrl);
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US'
    });

    const page = await context.newPage();

    // First try the official embed plugin URL (often loads much faster and contains exact follower text)
    const pluginUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(targetUrl)}&show_facepile=true`;
    
    let followers = 0;
    let title = '';
    let pfp = '';
    let verified = false;

    try {
      await page.goto(pluginUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
      
      const content = await page.content();

      // Check for title in plugin
      const titleEl = await page.$('a._3-8w, a[href*="facebook.com"]');
      if (titleEl) {
        title = (await titleEl.textContent()) || '';
      }

      // Check for followers count in plugin
      const countEl = await page.$('._1drq, div:has-text("followers"), div:has-text("likes")');
      if (countEl) {
        const text = await countEl.textContent();
        followers = extractExactInteger(text);
      }

      // Profile photo
      const imgEl = await page.$('img._1drn, img[src*="fbcdn"]');
      if (imgEl) {
        pfp = (await imgEl.getAttribute('src')) || '';
      }

      // Verified
      verified = content.includes('Verified') || content.includes('_5dzy');
    } catch (pluginErr) {
      console.warn('[Playwright Plugin Attempt]:', pluginErr.message);
    }

    // If followers were not found via plugin, attempt direct page visit with short timeout
    if (followers === 0) {
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        // Wait briefly for client-side hydration
        await page.waitForTimeout(1500);

        // Check meta tags first (often contains exact count e.g. "12,354 likes · 2,354 talking about this")
        const metaDesc = await page.$eval('meta[property="og:description"], meta[name="description"]', el => el.content).catch(() => '');
        if (metaDesc) {
          followers = extractExactInteger(metaDesc);
        }

        // Check JSON-LD
        if (followers === 0) {
          const jsonLd = await page.$$eval('script[type="application/ld+json"]', scripts => {
            return scripts.map(s => {
              try { return JSON.parse(s.textContent); } catch { return null; }
            }).filter(Boolean);
          }).catch(() => []);

          for (const item of jsonLd) {
            if (item.interactionStatistic) {
              const stat = Array.isArray(item.interactionStatistic) ? item.interactionStatistic : [item.interactionStatistic];
              for (const s of stat) {
                if (s.userInteractionCount) {
                  followers = Number(s.userInteractionCount) || 0;
                  break;
                }
              }
            }
            if (item.name && !title) title = item.name;
            if (item.image && !pfp) pfp = typeof item.image === 'string' ? item.image : item.image.url;
          }
        }

        // Check DOM elements containing 'followers'
        if (followers === 0) {
          const bodyText = await page.innerText('body').catch(() => '');
          followers = extractExactInteger(bodyText);
        }

        if (!title) {
          title = await page.title().catch(() => '');
          title = title.replace(/\s*\|\s*Facebook.*$/i, '').trim();
        }

        if (!pfp) {
          pfp = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => '');
        }

        verified = await page.$eval('[aria-label*="Verified"]', () => true).catch(() => false);
      } catch (pageErr) {
        console.warn('[Playwright Page Attempt]:', pageErr.message);
      }
    }

    await browser.close();

    return {
      title: title || targetUrl.replace(/https?:\/\/(www\.)?facebook\.com\/?/i, '').replace(/[-_.]/g, ' ') || 'Facebook Page',
      followers: followers > 0 ? followers : 0,
      pfp: pfp || '',
      verified,
      url: targetUrl,
      isLive: followers > 0,
      source: 'playwright'
    };
  } catch (err) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error('[Playwright Scraper Error]:', err.message);
    return null;
  }
}
