import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, DollarSign, TrendingUp, Receipt, Clock } from 'lucide-react';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import { formatMoney, formatDate, statusBadgeClass, extractError } from '../lib/utils';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#22c55e'];

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/all')
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  const s = data.summary;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your business" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Products" value={s.totalProducts} icon={Package} color="indigo" />
        <StatCard
          label="Stock value"
          value={formatMoney(s.totalStockValue)}
          icon={DollarSign}
          color="blue"
          hint="purchase price × stock"
        />
        <StatCard label="Today's sales" value={formatMoney(s.todaySales)} icon={Receipt} color="green" />
        <StatCard label="Monthly revenue" value={formatMoney(s.monthlyRevenue)} icon={TrendingUp} color="green" />
        <StatCard label="Pending payments" value={formatMoney(s.pendingPayments)} icon={Clock} color="amber" />
        <StatCard label="Low-stock items" value={s.lowStockCount} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3">Sales — last 30 days</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data.sales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-3">Sales by category</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.byCategory} dataKey="total" nameKey="name" outerRadius={90} label>
                  {data.byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Recent invoices</h3>
            <Link to="/invoices" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2">Invoice #</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">No invoices yet</td>
                  </tr>
                ) : (
                  data.recent.map((inv) => (
                    <tr key={inv._id} className="border-b border-slate-100 dark:border-slate-700/50">
                      <td className="py-2 font-medium">{inv.invoiceNumber}</td>
                      <td className="py-2">{inv.customer?.name || '-'}</td>
                      <td className="py-2">{formatDate(inv.issuedAt)}</td>
                      <td className="py-2">{formatMoney(inv.grandTotal)}</td>
                      <td className="py-2">
                        <span className={statusBadgeClass(inv.status)}>{inv.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Top 5 products</h3>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={data.top} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                <Tooltip />
                <Bar dataKey="quantitySold" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="font-semibold mt-4 mb-2">Low-stock list</h3>
          <div className="space-y-2">
            {data.low.length === 0 ? (
              <p className="text-sm text-slate-500">All products are sufficiently stocked.</p>
            ) : (
              data.low.map((p) => (
                <div key={p._id} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700/50 pb-1">
                  <span>{p.name}</span>
                  <span className={statusBadgeClass('low_stock')}>{p.stock} left</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;