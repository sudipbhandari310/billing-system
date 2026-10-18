import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const CategoriesPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setItems(res.data.data.categories);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({ name: row.name, description: row.description || '' });
    setOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing._id}`, data);
        toast.success('Category updated');
      } else {
        await api.post('/categories', data);
        toast.success('Category created');
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
      await api.delete(`/categories/${confirmDel._id}`);
      toast.success('Category deleted');
      setConfirmDel(null);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'description', label: 'Description', render: (r) => r.description || '-' },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
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
        title="Categories"
        subtitle={`${items.length} categories`}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add category
          </button>
        }
      />

      <DataTable columns={columns} rows={items} loading={loading} emptyMessage="No categories" />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'Add category'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button form="cat-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <form id="cat-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" {...register('name')} />
            {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input" {...register('description')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete category"
        message={`Delete "${confirmDel?.name}"? Products in this category must be reassigned first.`}
        confirmText="Delete"
        danger
        onCancel={() => setConfirmDel(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CategoriesPage;