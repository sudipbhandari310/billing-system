import { useState } from 'react';
import Pagination from './Pagination';
import Spinner from './Spinner';

const DataTable = ({ columns, rows, loading, total, page, limit, onPageChange, emptyMessage = 'No data' }) => {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="table-head">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row._id || row.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  {columns.map((c) => (
                    <td key={c.key} className="table-cell">
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <div className="px-4 pb-4">
          <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
};

export default DataTable;