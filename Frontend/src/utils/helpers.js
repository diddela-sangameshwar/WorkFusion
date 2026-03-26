/**
 * Format a date string or Date object to a localized display string.
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', { ...defaults, ...options });
};

/**
 * Format a date to include time.
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get relative time from now (e.g. "2 hours ago", "in 3 days")
 */
export const timeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    // Future date
    const futureDays = Math.abs(diffDays);
    if (futureDays === 0) return 'Today';
    if (futureDays === 1) return 'Tomorrow';
    return `in ${futureDays} days`;
  }

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(date);
};

/**
 * Format a number with compact notation (e.g. 1.2K, 3.5M)
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

/**
 * Clamp a number between min and max.
 */
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * Get initials from a full name (e.g. "John Doe" → "JD")
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Get a color from a score value.
 */
export const getScoreColor = (score) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  if (score >= 25) return '#ea580c';
  return '#ef4444';
};

/**
 * Truncate text to maxLen characters with ellipsis.
 */
export const truncate = (text, maxLen = 100) => {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
};

/**
 * Download JSON data as a file.
 */
export const downloadJSON = (data, filename = 'report.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
