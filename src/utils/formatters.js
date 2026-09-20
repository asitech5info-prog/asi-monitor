/**
 * Formats a follower count with 100% exact accuracy (never rounds 2354 to 2.4k).
 * e.g. 2354 -> "2,354", 489200 -> "489,200"
 */
export function formatExactFollowers(num) {
  if (num === null || num === undefined || num === '') return '0';
  const clean = typeof num === 'string' ? num.replace(/,/g, '').trim() : num;
  const n = parseInt(clean, 10);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/**
 * Formats a number into a clean string.
 * For exact follower displays, use formatExactFollowers.
 */
export function formatMetric(num) {
  if (num === null || num === undefined || num === '') return '0';
  const clean = typeof num === 'string' ? num.replace(/,/g, '').trim() : num;
  const n = Number(clean);
  if (isNaN(n)) return String(num);
  return n.toLocaleString('en-US');
}

/**
 * Format delta growth (e.g. 35 -> "+35", 3100 -> "+3,100")
 */
export function formatGrowth(num) {
  if (!num || num === 0) return '+0';
  const n = typeof num === 'string' ? parseFloat(num) : Number(num);
  const rounded = Math.round(n);
  const formatted = Math.abs(rounded).toLocaleString('en-US');
  return rounded >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Parse a human string into an integer
 */
export function parseMetric(str) {
  if (typeof str === 'number') return Math.round(str);
  if (!str) return 0;
  const clean = str.trim().toUpperCase().replace(/,/g, '');
  if (clean.endsWith('B')) return Math.round(parseFloat(clean) * 1_000_000_000);
  if (clean.endsWith('M')) return Math.round(parseFloat(clean) * 1_000_000);
  if (clean.endsWith('K')) return Math.round(parseFloat(clean) * 1_000);
  const val = parseInt(clean.replace(/[^0-9]/g, ''), 10);
  return isNaN(val) ? 0 : val;
}

