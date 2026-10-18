import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { formatMoney, extractError } from '../lib/utils';
import toast from 'react-hot-toast';

const InvoiceFormPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customer, setCustomer] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([api.get('/customers?limit=200'), api.get('/products/all?limit=500')])
      .then(([cRes, pRes]) => {
        setCustomers(cRes.data.data.customers);
        setProducts(pRes.data.data.products);
        if (cRes.data.data.customers.length) setCustomer(cRes.data.data.customers[0]._id);
      })
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  const addItem = (p) => {
    if (items.find((i) => i.product === p._id)) return;
    setItems((prev) => [
      ...prev,
      {
        product: p._id,
        name: p.name,
        sku: p.sku,
        quantity: 1,
        price: p.sellingPrice,
        stock: p.stock,
        available: p.stock > 0,
      },
    ]);
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
    const discounted = Math.max(0, subtotal - (Number(discount) || 0));
    const taxAmount = +((discounted * (Number(taxPercent) || 0)) / 100).toFixed(2);
    const grandTotal = +(discounted + taxAmount).toFixed(2);
    const balance = +(grandTotal - (Number(amountPaid) || 0)).toFixed(2);
    return {
      subtotal: +subtotal.toFixed(2),
      taxAmount,
      balance,
      grandTotal,
    };
  }, [items, discount, taxPercent, amountPaid]);

  const filteredProducts = (term) => {
    const t = (term || '').toLowerCase();
    if (!t) return products.filter((p) => p.stock > 0).slice(0, 30);
    return products
      .filter((p) => p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t))
      .slice(0, 30);
  };

  const submit = async () => {
    if (!customer) return toast.error('Please select a customer');
    if (items.length === 0) return toast.error('Please add at least one item');
    for (const it of items) {
      if (it.quantity < 1) return toast.error(`Quantity must be >= 1 for ${it.name}`);
      if (it.price < 0) return toast.error(`Price cannot be negative for ${it.name}`);
      if (it.quantity > it.stock) {
        return toast.error(`Insufficient stock for ${it.name}. Available: ${it.stock}`);
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        customer,
        items: items.map((it) => ({
          product: it.product,
          quantity: Number(it.quantity),
          price: Number(it.price),
        })),
        discount: Number(discount) || 0,
        taxPercent: Number(taxPercent) || 0,
        amountPaid: Number(amountPaid) || 0,
        notes,
      };
      const res = await api.post('/invoices', payload);
      toast.success('Invoice created');
      navigate(`/invoices/${res.data.data.invoice._id}`);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create invoice"
        actions={
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold mb-3">Items</h3>

            <div className="flex gap-2 mb-3">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input"
                placeholder="Search products by name or SKU…"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded mb-3">
              {filteredProducts(productSearch).length === 0 ? (
                <div className="p-3 text-sm text-slate-500">No matching products</div>
              ) : (
                filteredProducts(productSearch).map((p) => (
                  <button
                    type="button"
                    key={p._id}
                    disabled={items.find((i) => i.product === p._id) || p.stock <= 0}
                    onClick={() => addItem(p)}
                    className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700/40 flex justify-between text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>
                      {p.name} <span className="text-xs text-slate-500">({p.sku})</span>
                    </span>
                    <span className="text-xs">
                      {formatMoney(p.sellingPrice)} • stock: {p.stock}
                    </span>
                  </button>
                ))
              )}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2">Item</th>
                  <th className="py-2 w-24">Qty</th>
                  <th className="py-2 w-32">Price</th>
                  <th className="py-2 w-32 text-right">Total</th>
                  <th className="py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No items added yet
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={it.product} className="border-b border-slate-100 dark:border-slate-700/50">
                      <td className="py-2">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-slate-500">{it.sku}</div>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="1"
                          max={it.stock}
                          className="input"
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input"
                          value={it.price}
                          onChange={(e) => updateItem(idx, { price: e.target.value })}
                        />
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatMoney(it.quantity * it.price)}
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          className="p-1.5 rounded text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <button
              type="button"
              onClick={() => addItem(filteredProducts(productSearch)[0])}
              disabled={filteredProducts(productSearch).length === 0}
              className="btn-secondary mt-2"
            >
              <Plus size={16} /> Quick add first match
            </button>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Notes</h3>
            <textarea
              rows={2}
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold">Customer</h3>
            <select className="input" value={customer} onChange={(e) => setCustomer(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Discount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Tax %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="input"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Amount paid</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>- {formatMoney(discount)}</span></div>
              <div className="flex justify-between"><span>Tax ({taxPercent}%)</span><span>{formatMoney(totals.taxAmount)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Grand total</span><span>{formatMoney(totals.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500"><span>Paid</span><span>{formatMoney(amountPaid)}</span></div>
              <div className="flex justify-between font-semibold">
                <span>Balance due</span><span>{formatMoney(totals.balance)}</span>
              </div>
            </div>
            <button onClick={submit} disabled={submitting} className="btn-primary w-full mt-4">
              {submitting ? <Spinner /> : 'Create invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFormPage;