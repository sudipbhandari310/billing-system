import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Download, X } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import FilterBar, { FilterSelect } from '../components/FilterBar';
import { formatMoney, formatDate, statusBadgeClass, downloadFile, extractError } from '../lib/utils';
import toast from 'react-hot-toast';

const InvoicesListPage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', {
        params: { page, limit, search, status, paymentStatus, from, to },
      });
      setItems(res.data.data.invoices);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, paymentStatus, from, to]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetch();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (paymentStatus) params.set('paymentStatus', paymentStatus);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/invoices/export.csv?${params}`;
      await downloadFile(url, 'invoices.csv');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleCancel = async (row) => {
    if (!window.confirm(`Cancel invoice ${row.invoiceNumber}? Stock will be restored.`)) return;
    try {
      await api.patch(`/invoices/${row._id}/cancel`);
      toast.success('Invoice cancelled');
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (r) => (
        <Link to={`/invoices/${r._id}`} className="font-medium text-indigo-600 hover:underline">
          {r.invoiceNumber}
        </Link>
      ),
    },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name || '-' },
    { key: 'issuedAt', label: 'Date', render: (r) => formatDate(r.issuedAt) },
    { key: 'grandTotal', label: 'Total', render: (r) => formatMoney(r.grandTotal) },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (r) => <span className={statusBadgeClass(r.paymentStatus)}>{r.paymentStatus}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <span className={statusBadgeClass(r.status)}>{r.status}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Link
            to={`/invoices/${r._id}`}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
            title="View"
          >
            <Eye size={16} />
          </Link>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/invoices/${r._id}/download`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Download PDF"
          >
            <Download size={16} />
          </a>
          {r.status !== 'cancelled' && (
            <button
              className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600"
              onClick={() => handleCancel(r)}
              title="Cancel"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${total} invoices`}
        actions={
          <>
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={16} /> Export CSV
            </button>
            <Link to="/invoices/new" className="btn-primary">
              <Plus size={16} /> New invoice
            </Link>
          </>
        }
      />

      <form onSubmit={onSearchSubmit} className="mb-4 flex flex-wrap gap-2 items-end">
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice # or customer" />
        <FilterBar>
          <FilterSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'issued', label: 'Issued' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            placeholder="All statuses"
          />
          <FilterSelect
            value={paymentStatus}
            onChange={(v) => {
              setPaymentStatus(v);
              setPage(1);
            }}
            options={[
              { value: 'paid', label: 'Paid' },
              { value: 'partial', label: 'Partial' },
              { value: 'unpaid', label: 'Unpaid' },
            ]}
            placeholder="All payments"
          />
          <div>
            <label className="text-xs text-slate-500 block mb-1">From</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">To</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary">Apply</button>
        </FilterBar>
      </form>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        emptyMessage="No invoices"
      />
    </div>
  );
};

export default InvoicesListPage;