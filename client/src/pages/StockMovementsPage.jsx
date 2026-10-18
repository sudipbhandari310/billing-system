import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchInput from '../components/SearchInput';
import FilterBar, { FilterSelect } from '../components/FilterBar';
import { formatDateTime, extractError } from '../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  product: z.string().min(1, 'Product is required'),
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be >= 1'),
  reason: z.string().optional(),
});

const StockMovementsPage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock/movements', { params: { page, limit, type } });
      setItems(res.data.data.movements);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/products/all').then((res) => setProducts(res.data.data.products));
  }, []);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post('/stock/adjust', data);
      toast.success('Stock updated');
      setOpen(false);
      reset({ product: '', type: 'IN', quantity: 1, reason: '' });
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    reset({ product: '', type: 'IN', quantity: 1, reason: '' });
    setOpen(true);
  };

  const filteredProducts = (term) => {
    const t = (term || '').toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t)
    );
  };

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (r) => (
        <div>
          <div className="font-medium">{r.product?.name}</div>
          <div className="text-xs text-slate-500">{r.product?.sku}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <span
          className={
            r.type === 'IN'
              ? 'badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : r.type === 'OUT'
              ? 'badge bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              : 'badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
          }
        >
          {r.type}
        </span>
      ),
    },
    { key: 'quantity', label: 'Qty', render: (r) => r.quantity },
    { key: 'reason', label: 'Reason', render: (r) => r.reason || '-' },
    { key: 'user', label: 'By', render: (r) => r.user?.name || '-' },
    { key: 'date', label: 'Date', render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        subtitle={`${total} movements`}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Adjust stock
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search…" />
        <FilterBar>
          <FilterSelect
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            options={[
              { value: 'IN', label: 'IN' },
              { value: 'OUT', label: 'OUT' },
              { value: 'ADJUST', label: 'ADJUST' },
            ]}
            placeholder="All types"
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        emptyMessage="No stock movements"
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adjust stock"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button form="stock-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="stock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="label">Product</label>
            <input
              className="input"
              placeholder="Type to search…"
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input mt-2" {...register('product')}>
              <option value="">Select product</option>
              {filteredProducts(search).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.sku} (stock: {p.stock})
                </option>
              ))}
            </select>
            {errors.product && <p className="text-xs text-rose-600">{errors.product.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" {...register('type')}>
                <option value="IN">IN (add)</option>
                <option value="OUT">OUT (remove)</option>
                <option value="ADJUST">ADJUST (set exact)</option>
              </select>
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" {...register('quantity')} />
              {errors.quantity && <p className="text-xs text-rose-600">{errors.quantity.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <input className="input" {...register('reason')} placeholder="e.g. damaged, restock" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StockMovementsPage;