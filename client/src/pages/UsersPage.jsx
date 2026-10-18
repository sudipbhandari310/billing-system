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
import { statusBadgeClass, extractError } from '../lib/utils';
import toast from 'react-hot-toast';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'staff']),
});

const updateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional().refine((v) => !v || v.length >= 8, 'Min 8 chars'),
  phone: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'staff']),
  isActive: z.boolean().optional(),
});

const UsersPage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editing;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
  });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { page, limit } });
      setItems(res.data.data.users);
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

  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        name: editing.name,
        email: editing.email,
        phone: editing.phone || '',
        role: editing.role,
        password: '',
        isActive: editing.isActive,
      });
    } else {
      reset({ name: '', email: '', password: '', phone: '', role: 'staff' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      if (editing) {
        await api.put(`/users/${editing._id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/auth/register', payload);
        toast.success('User created');
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
      await api.delete(`/users/${confirmDel._id}`);
      toast.success('User deleted');
      setConfirmDel(null);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => <span className="badge bg-slate-100 dark:bg-slate-700 capitalize">{r.role}</span> },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => (
        <span className={statusBadgeClass(r.isActive ? 'active' : 'inactive')}>
          {r.isActive ? 'active' : 'inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => { setEditing(r); setOpen(true); }}>
            <Pencil size={16} />
          </button>
          <button className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600" onClick={() => setConfirmDel(r)}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${total} users`}
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Add user
          </button>
        }
      />

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        emptyMessage="No users"
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit user' : 'Add user'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button form="user-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="label">Name</label>
            <input className="input" {...register('name')} />
            {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" {...register('email')} />
            {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" {...register('role')}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {editing && (
            <div>
              <label className="label">Status</label>
              <select className="input" {...register('isActive')}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="label">{editing ? 'New password (leave blank to keep current)' : 'Password'}</label>
            <input type="password" className="input" {...register('password')} />
            {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete user"
        message={`Delete "${confirmDel?.name}"? This cannot be undone.`}
        confirmText="Delete"
        danger
        onCancel={() => setConfirmDel(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default UsersPage;