import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, X, DollarSign } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { formatMoney, formatDate, statusBadgeClass, extractError } from '../lib/utils';
import toast from 'react-hot-toast';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [updating, setUpdating] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.data.invoice);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    try {
      await api.patch(`/invoices/${id}/cancel`);
      toast.success('Invoice cancelled');
      setConfirmCancel(false);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const handlePayment = async () => {
    if (paymentAmount < 0) return toast.error('Amount must be >= 0');
    setUpdating(true);
    try {
      await api.patch(`/invoices/${id}/payment`, { amountPaid: paymentAmount });
      toast.success('Payment updated');
      setPaymentOpen(false);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }
  if (!invoice) {
    return <p className="text-slate-500">Invoice not found.</p>;
  }

  const isCancelled = invoice.status === 'cancelled';

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Issued on ${formatDate(invoice.issuedAt)}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <a
              className="btn-secondary"
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/invoices/${invoice._id}/download`}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={16} /> PDF
            </a>
            <a
              className="btn-secondary"
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/invoices/${invoice._id}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              Preview
            </a>
            {!isCancelled && (
              <>
                <button className="btn-secondary" onClick={() => {
                  setPaymentAmount(invoice.amountPaid);
                  setPaymentOpen(true);
                }}>
                  <DollarSign size={16} /> Record payment
                </button>
                <button className="btn-danger" onClick={() => setConfirmCancel(true)}>
                  <X size={16} /> Cancel invoice
                </button>
              </>
            )}
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="font-semibold mb-1">Bill to</h3>
              <p className="text-sm">{invoice.customer?.name}</p>
              <p className="text-sm text-slate-500">{invoice.customer?.email}</p>
              <p className="text-sm text-slate-500">{invoice.customer?.phone}</p>
              <p className="text-sm text-slate-500">{invoice.customer?.address}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-1"><span className={statusBadgeClass(invoice.status)}>{invoice.status}</span></p>
              <p className="text-sm text-slate-500 mt-2">Payment</p>
              <p className="mt-1"><span className={statusBadgeClass(invoice.paymentStatus)}>{invoice.paymentStatus}</span></p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2">Item</th>
                <th className="py-2 w-20 text-right">Qty</th>
                <th className="py-2 w-32 text-right">Price</th>
                <th className="py-2 w-32 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-2">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-slate-500">{it.sku}</div>
                  </td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right">{formatMoney(it.price)}</td>
                  <td className="py-2 text-right">{formatMoney(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoice.notes && (
            <p className="text-sm text-slate-500 mt-4">
              <span className="font-medium text-slate-700 dark:text-slate-300">Notes: </span>
              {invoice.notes}
            </p>
          )}
        </div>

        <div className="card p-4 space-y-2 text-sm">
          <h3 className="font-semibold mb-2">Summary</h3>
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(invoice.subtotal)}</span></div>
          {invoice.discount > 0 && (
            <div className="flex justify-between"><span>Discount</span><span>- {formatMoney(invoice.discount)}</span></div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between"><span>Tax ({invoice.taxPercent}%)</span><span>{formatMoney(invoice.taxAmount)}</span></div>
          )}
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>Grand total</span><span>{formatMoney(invoice.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500"><span>Paid</span><span>{formatMoney(invoice.amountPaid)}</span></div>
          <div className="flex justify-between font-semibold">
            <span>Balance due</span><span>{formatMoney(invoice.balanceDue)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            Created by {invoice.createdBy?.name || '-'}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Link to="/invoices" className="text-sm text-indigo-600 hover:underline">← Back to invoices</Link>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel invoice"
        message={`Cancel ${invoice.invoiceNumber}? Stock will be restored.`}
        confirmText="Cancel invoice"
        danger
        onCancel={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
      />

      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record payment"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPaymentOpen(false)}>Close</button>
            <button onClick={handlePayment} disabled={updating} className="btn-primary">
              {updating ? 'Saving…' : 'Save payment'}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-500">
            Grand total: <span className="font-medium">{formatMoney(invoice.grandTotal)}</span>
          </p>
          <div>
            <label className="label">Amount paid</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceDetailPage;