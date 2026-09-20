/**
 * Formats a number into a clean abbreviated string e.g. 489200 -> "489.2K"
 */
export function formatMetric(num) {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : Number(num);
  if (isNaN(n)) return String(num);

  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return n.toLocaleString();
}

/**
 * Format delta growth (e.g. 3100 -> "+3.1K")
 */
export function formatGrowth(num) {
  if (!num || num === 0) return '+0';
  const n = typeof num === 'string' ? parseFloat(num) : Number(num);
  const formatted = formatMetric(Math.abs(n));
  return n >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Parse a human string into an integer
 */
export function parseMetric(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const clean = str.trim().toUpperCase().replace(/,/g, '');
  if (clean.endsWith('B')) return Math.round(parseFloat(clean) * 1_000_000_000);
  if (clean.endsWith('M')) return Math.round(parseFloat(clean) * 1_000_000);
  if (clean.endsWith('K')) return Math.round(parseFloat(clean) * 1_000);
  const val = parseInt(clean.replace(/[^0-9]/g, ''), 10);
  return isNaN(val) ? 0 : val;
}
