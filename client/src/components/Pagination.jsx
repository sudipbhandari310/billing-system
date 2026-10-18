import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, limit, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  const goTo = (p) => {
    if (p < 1 || p > totalPages) return;
    onPageChange(p);
  };

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <div className="text-slate-500 dark:text-slate-400">
        Showing {from}-{to} of {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary px-2 py-1 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2">
          Page {page} of {totalPages}
        </span>
        <button
          className="btn-secondary px-2 py-1 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;