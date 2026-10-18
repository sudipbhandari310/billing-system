import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchInput from '../components/SearchInput';
import { useAuth } from '../context/AuthContext';
import { formatMoney, formatDate, statusBadgeClass, extractError } from '../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

const CustomersPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [history, setHistory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { page, limit, search } });
      setItems(res.data.data.customers);
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
  }, [page]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetch();
  };

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', phone: '', email: '', address: '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({ name: row.name, phone: row.phone || '', email: row.email || '', address: row.address || '' });
    setOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing._id}`, data);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created');
      }
      setOpen(false);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${confirmDel._id}`);
      toast.success('Customer deleted');
      setConfirmDel(null);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const openHistory = async (row) => {
    try {
      const res = await api.get(`/customers/${row._id}/history`);
      setHistory({ ...row, invoices: res.data.data.invoices });
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="View history" onClick={() => openHistory(r)}>
            <Receipt size={16} />
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => openEdit(r)}>
            <Pencil size={16} />
          </button>
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
        title="Customers"
        subtitle={`${total} customers`}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add customer
          </button>
        }
      />

      <form onSubmit={onSearchSubmit} className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone or email" />
      </form>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        emptyMessage="No customers"
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit customer' : 'Add customer'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button form="cust-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <form id="cust-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="label">Name</label>
            <input className="input" {...register('name')} />
            {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" {...register('email')} />
            {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="label">Address</label>
            <textarea rows={2} className="input" {...register('address')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete customer"
        message={`Delete "${confirmDel?.name}"?`}
        confirmText="Delete"
        danger
        onCancel={() => setConfirmDel(null)}
        onConfirm={handleDelete}
      />

      <Modal
        open={!!history}
        onClose={() => setHistory(null)}
        title={`${history?.name} — Invoice history`}
        maxWidth="max-w-2xl"
      >
        {history?.invoices?.length === 0 ? (
          <p className="text-slate-500 text-sm">No invoices for this customer.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2">Invoice #</th>
                <th className="py-2">Date</th>
                <th className="py-2">Total</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {history?.invoices?.map((inv) => (
                <tr key={inv._id} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-2">{inv.invoiceNumber}</td>
                  <td className="py-2">{formatDate(inv.issuedAt)}</td>
                  <td className="py-2">{formatMoney(inv.grandTotal)}</td>
                  <td className="py-2">
                    <span className={statusBadgeClass(inv.status)}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
};

export default CustomersPage;