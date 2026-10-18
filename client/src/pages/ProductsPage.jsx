import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchInput from '../components/SearchInput';
import FilterBar, { FilterSelect } from '../components/FilterBar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { formatMoney, statusBadgeClass, extractError, downloadFile } from '../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  purchasePrice: z.coerce.number().min(0, '>= 0'),
  sellingPrice: z.coerce.number().min(0, '>= 0'),
  stock: z.coerce.number().int().min(0, '>= 0'),
  lowStockThreshold: z.coerce.number().int().min(0, '>= 0'),
  status: z.enum(['active', 'inactive']),
  description: z.string().optional(),
});

const stockOptions = [
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
];

const ProductsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: { page, limit, search, category, stockStatus },
      });
      setItems(res.data.data.products);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data.categories || []));
  }, []);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, stockStatus]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetch();
  };

  const openCreate = () => {
    setEditing(null);
    reset({
      name: '',
      sku: '',
      category: categories[0]?._id || '',
      purchasePrice: 0,
      sellingPrice: 0,
      stock: 0,
      lowStockThreshold: 5,
      status: 'active',
      description: '',
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      name: row.name,
      sku: row.sku,
      category: row.category?._id || row.category,
      purchasePrice: row.purchasePrice,
      sellingPrice: row.sellingPrice,
      stock: row.stock,
      lowStockThreshold: row.lowStockThreshold,
      status: row.status,
      description: row.description || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/products/${editing._id}`, data);
        toast.success('Product updated');
      } else {
        await api.post('/products', data);
        toast.success('Product created');
      }
      setModalOpen(false);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await api.delete(`/products/${confirmDel._id}`);
      toast.success('Product deleted');
      setConfirmDel(null);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (stockStatus) params.set('stockStatus', stockStatus);
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/products/export.csv?${params}`;
      await downloadFile(url, 'products.csv');
    } catch {
      toast.error('Export failed');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <div className="font-medium">{r.name}</div> },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category', render: (r) => r.category?.name || '-' },
    { key: 'sellingPrice', label: 'Price', render: (r) => formatMoney(r.sellingPrice) },
    { key: 'stock', label: 'Stock', render: (r) => <span className={statusBadgeClass(r.stockStatus)}>{r.stock}</span> },
    { key: 'status', label: 'Status', render: (r) => <span className={statusBadgeClass(r.status)}>{r.status}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => openEdit(r)}>
              <Pencil size={16} />
            </button>
          )}
          {user?.role === 'admin' && (
            <button className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600" onClick={() => setConfirmDel(r)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${total} products`}
        actions={
          <>
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={16} /> Export CSV
            </button>
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <button className="btn-primary" onClick={openCreate}>
                <Plus size={16} /> Add product
              </button>
            )}
          </>
        }
      />

      <form onSubmit={onSearchSubmit} className="mb-4 flex flex-wrap gap-2 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or SKU" />
        <FilterBar>
          <FilterSelect
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
            placeholder="All categories"
          />
          <FilterSelect
            value={stockStatus}
            onChange={(v) => {
              setStockStatus(v);
              setPage(1);
            }}
            options={stockOptions}
            placeholder="All stock"
          />
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
        emptyMessage="No products found"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit product' : 'Add product'}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button form="product-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Spinner /> : editing ? 'Save changes' : 'Create'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Name</label>
            <input className="input" {...register('name')} />
            {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input" {...register('sku')} />
            {errors.sku && <p className="text-xs text-rose-600">{errors.sku.message}</p>}
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" {...register('category')}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-rose-600">{errors.category.message}</p>}
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">Purchase price</label>
            <input type="number" step="0.01" className="input" {...register('purchasePrice')} />
            {errors.purchasePrice && <p className="text-xs text-rose-600">{errors.purchasePrice.message}</p>}
          </div>
          <div>
            <label className="label">Selling price</label>
            <input type="number" step="0.01" className="input" {...register('sellingPrice')} />
            {errors.sellingPrice && <p className="text-xs text-rose-600">{errors.sellingPrice.message}</p>}
          </div>
          <div>
            <label className="label">Stock</label>
            <input type="number" className="input" {...register('stock')} />
            {errors.stock && <p className="text-xs text-rose-600">{errors.stock.message}</p>}
          </div>
          <div>
            <label className="label">Low-stock threshold</label>
            <input type="number" className="input" {...register('lowStockThreshold')} />
            {errors.lowStockThreshold && <p className="text-xs text-rose-600">{errors.lowStockThreshold.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea rows={2} className="input" {...register('description')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete product"
        message={`Are you sure you want to delete "${confirmDel?.name}"? This cannot be undone.`}
        confirmText="Delete"
        danger
        onCancel={() => setConfirmDel(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ProductsPage;