// utils/helpers.js

export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount || 0);

export const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return '0';

  const sign = num < 0 ? '-' : '';
  let n = Math.abs(num);

  // Handle rounding overflow (e.g., 999.9K → 1M)
  if (n >= 999_500) n = Math.round(n);

  if (n >= 1_000_000_000) {
    const value = n / 1_000_000_000;
    return sign + value.toFixed(1).replace(/\.0$/, '') + 'B';
  }

  if (n >= 1_000_000) {
    const value = n / 1_000_000;
    return sign + value.toFixed(1).replace(/\.0$/, '') + 'M';
  }

  if (n >= 1_000) {
    const value = n / 1_000;
    return sign + value.toFixed(1).replace(/\.0$/, '') + 'K';
  }

  return sign + Math.floor(n).toString();
};
export const formatCompactCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '$0';
  const symbol = new Intl.NumberFormat('en-US', { style: 'currency', currency }).formatToParts(0)[0].value;
  const compact = formatCompactNumber(amount);
  return `${symbol}${compact}`;
};

export const formatDate = (date, opts = {}) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', ...opts });

export const formatRelative = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const truncate = (str, n = 100) =>
  str?.length > n ? str.slice(0, n) + '...' : str;

export const getAvatarGradient = (id = '') => {
  const gradients = [
    'linear-gradient(135deg,#6C4EF6,#9B6DFF)',
    'linear-gradient(135deg,#FF6B35,#FF4D6A)',
    'linear-gradient(135deg,#00E5C3,#00B894)',
    'linear-gradient(135deg,#FFB52E,#FF6B35)',
    'linear-gradient(135deg,#6C4EF6,#FF4D6A)',
    'linear-gradient(135deg,#9B6DFF,#00E5C3)',
  ];
  const idx = id.charCodeAt(0) % gradients.length;
  return gradients[idx];
};

export const statusColor = (status) => {
  const map = {
    open: 'ok', active: 'ok', completed: 'ok', passed: 'ok', accepted: 'ok',
    in_progress: 'info', delivered: 'info', under_review: 'warn',
    pending: 'warn', viewed: 'warn', shortlisted: 'warn',
    cancelled: 'err', rejected: 'err', disputed: 'err', failed: 'err',
  };
  return map[status] || 'gray';
};

export const debounce = (fn, delay = 300) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

export const buildQueryString = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
