export const formatMoney = (n, currency = 'NPR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0))
  .replace(/^[^0-9-]+/, 'Rs ');

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

export const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : '-');

export const cn = (...args) => args.filter(Boolean).join(' ');

export const extractError = (err, fallback = 'Something went wrong') => {
  const msg = err?.response?.data?.message;
  if (msg) return msg;
  if (err?.message) return err.message;
  return fallback;
};

export const downloadFile = async (url, fallbackName) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  const link = URL.createObjectURL(blob);
  a.href = link;
  a.download = fallbackName || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(link);
};

export const statusBadgeClass = (status) => {
  switch (status) {
    case 'paid':
    case 'issued':
    case 'in_stock':
    case 'active':
      return 'badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'partial':
    case 'low_stock':
      return 'badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'unpaid':
    case 'out_of_stock':
    case 'cancelled':
      return 'badge bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
    case 'draft':
    case 'inactive':
      return 'badge bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    default:
      return 'badge bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }
};