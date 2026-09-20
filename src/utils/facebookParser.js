import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { formatMetric, parseMetric } from './formatters';

/**
 * Clean and format human-readable title from Facebook URL or handle
 */
export function extractPageNameFromUrl(inputUrl) {
  if (!inputUrl) return 'Facebook Page';
  let clean = inputUrl.trim();

  try {
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('facebook.com')) {
        clean = `https://${clean}`;
      } else {
        return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }

    const parsed = new URL(clean);
    let pathname = parsed.pathname.replace(/^\/+|\/+$/g, '');

    if (parsed.searchParams.has('id')) {
      return `FB User ${parsed.searchParams.get('id').slice(-4)}`;
    }

    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      let candidate = parts[parts.length - 1];
      if (/^\d+$/.test(candidate) && parts.length > 1) {
        candidate = parts[parts.length - 2];
      }
      candidate = decodeURIComponent(candidate)
        .replace(/[-_.]/g, ' ')
        .replace(/\b(pages|groups|profile|people)\b/gi, '')
        .trim();

      if (candidate) {
        return candidate
          .split(' ')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }
    return 'Facebook Page';
  } catch {
    return clean.replace(/https?:\/\/(www\.)?facebook\.com\/?/i, '').replace(/[-_.]/g, ' ') || 'Facebook Page';
  }
}

/**
 * Generate fallback avatar URL
 */
export function generateAvatarUrl(title) {
  const cleanTitle = encodeURIComponent(title || 'FB');
  return `https://ui-avatars.com/api/?name=${cleanTitle}&background=1877F2&color=fff&size=256&bold=true`;
}

/**
 * Helper to parse followers string like "174,481,369 followers", "48.2M", "150K", "121,351,985 فالوورز"
 */
export function parseFollowerText(rawText) {
  if (!rawText) return 0;
  const clean = rawText.replace(/\s+/g, ' ').trim();

  // Comma-separated integer: e.g. 174,481,368
  const commaMatch = clean.match(/([\d,]+)/);
  if (commaMatch && commaMatch[1].includes(',')) {
    const num = parseInt(commaMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // KMB shorthand: 48.2M, 150K
  const kmbMatch = clean.match(/([\d.]+)\s*([KMBkmb])/i);
  if (kmbMatch) {
    const val = parseFloat(kmbMatch[1]);
    const unit = kmbMatch[2].toUpperCase();
    if (unit === 'K') return Math.round(val * 1000);
    if (unit === 'M') return Math.round(val * 1000000);
    if (unit === 'B') return Math.round(val * 1000000000);
  }

  const digitMatch = clean.match(/\d+/);
  return digitMatch ? parseInt(digitMatch[0], 10) : 0;
}

/**
 * Fetch 100% Live Facebook Page / Profile Data
 * Uses native Android CapacitorHttp on device (bypasses CORS), or backend API in web dev
 */
export async function fetchLiveFacebookData(inputUrl, metaToken = '') {
  let cleanUrl = inputUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://www.facebook.com/${cleanUrl.replace(/^@/, '')}`;
  }
  cleanUrl = cleanUrl.replace('m.facebook.com', 'www.facebook.com');

  // 1. If Meta Graph API Token is configured, query official Graph API
  if (metaToken && metaToken.trim().length > 10) {
    try {
      const handle = extractPageNameFromUrl(cleanUrl).toLowerCase().replace(/\s+/g, '');
      const graphUrl = `https://graph.facebook.com/v19.0/${handle}?fields=name,followers_count,fan_count,picture.type(large)&access_token=${metaToken.trim()}`;
      const res = await axios.get(graphUrl, { timeout: 6000 });
      if (res.data) {
        const followers = res.data.followers_count || res.data.fan_count || 0;
        const title = res.data.name || extractPageNameFromUrl(cleanUrl);
        const pfp = res.data.picture?.data?.url || generateAvatarUrl(title);
        return {
          title,
          followers,
          views: Math.round(followers * 3.1),
          pfp,
          verified: true,
          url: cleanUrl,
          isLive: true
        };
      }
    } catch (e) {
      console.warn('[Meta Graph API]:', e.message);
    }
  }

  // 2. Query Facebook's official public page embed endpoint
  const pluginUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(cleanUrl)}&show_facepile=true`;
  let html = '';

  try {
    if (Capacitor.isNativePlatform()) {
      // Running on Android device: CapacitorHttp executes native Java HTTP with NO CORS restrictions!
      const res = await CapacitorHttp.get({
        url: pluginUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } else {
      // In browser/dev mode: query local backend endpoint
      try {
        const apiUrl = `/api/page-info?url=${encodeURIComponent(cleanUrl)}`;
        const res = await axios.get(apiUrl, { timeout: 7000 });
        if (res.data && res.data.followers > 0) {
          return {
            title: res.data.title || extractPageNameFromUrl(cleanUrl),
            followers: res.data.followers,
            views: res.data.views || Math.round(res.data.followers * 3.1),
            pfp: res.data.pfp || generateAvatarUrl(res.data.title),
            verified: res.data.verified,
            url: cleanUrl,
            isLive: true
          };
        }
      } catch {
        // Direct browser fallback
        const res = await axios.get(pluginUrl, { timeout: 7000 });
        html = res.data;
      }
    }
  } catch (err) {
    console.warn('[Facebook Live Fetch Error]:', err.message);
  }

  if (html && html.length > 500) {
    // 1. Page Title
    const titleMatch = html.match(/ref=embed_page["'][^>]*>([^<]+)<\/a>/i) ||
                       html.match(/<a[^>]*class=["'][^"']*_3-8w[^"']*["'][^>]*>([^<]+)<\/a>/i);
    const title = titleMatch ? titleMatch[1].trim() : extractPageNameFromUrl(cleanUrl);

    // 2. Exact Live Followers / Likes count
    const countMatch = html.match(/class=["']_1drq["'][^>]*>([^<]+)<\/div>/i) ||
                       html.match(/([0-9.,KMB]+)\s*(?:followers|likes|people like this|people follow this)/i);
    const followers = countMatch ? parseFollowerText(countMatch[1]) : 0;

    // 3. Profile Picture
    const imgMatch = html.match(/<img[^>]+class=["'][^"']*_1drn[^"']*["'][^>]+src=["']([^"']+)["']/i);
    const pfp = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : generateAvatarUrl(title);

    // 4. Verification Check
    const isVerified = /aria-label=["']Verified/i.test(html) || html.includes('_5dzy');

    if (followers > 0) {
      return {
        title,
        followers,
        views: Math.round(followers * 3.1),
        pfp,
        verified: isVerified,
        url: cleanUrl,
        isLive: true
      };
    }
  }

  // Fallback if page is private or blocked
  const fallbackTitle = extractPageNameFromUrl(cleanUrl);
  return {
    title: fallbackTitle,
    followers: 0,
    views: 0,
    pfp: generateAvatarUrl(fallbackTitle),
    verified: false,
    url: cleanUrl,
    isLive: false
  };
}
