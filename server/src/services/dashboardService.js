import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfMonth = (d = new Date()) => {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const summary = async () => {
  const todayStart = startOfDay();
  const monthStart = startOfMonth();

  const [totalProducts, lowStockProducts, productAgg, todaySalesAgg, monthSalesAgg, pendingAgg] =
    await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({
        status: 'active',
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      }),
      Product.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalStockValue: { $sum: { $multiply: ['$stock', '$purchasePrice'] } } } },
      ]),
      Invoice.aggregate([
        { $match: { status: 'issued', issuedAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Invoice.aggregate([
        { $match: { status: 'issued', issuedAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Invoice.aggregate([
        {
          $match: {
            status: 'issued',
            paymentStatus: { $in: ['unpaid', 'partial'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$balanceDue' } } },
      ]),
    ]);

  return {
    totalProducts,
    lowStockCount: lowStockProducts,
    totalStockValue: productAgg[0]?.totalStockValue || 0,
    todaySales: todaySalesAgg[0]?.total || 0,
    monthlyRevenue: monthSalesAgg[0]?.total || 0,
    pendingPayments: pendingAgg[0]?.total || 0,
  };
};

export const salesLast30Days = async () => {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const data = await Invoice.aggregate([
    { $match: { status: 'issued', issuedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$issuedAt' } },
        total: { $sum: '$grandTotal' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = new Map(data.map((d) => [d._id, d.total]));
  const result = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, total: map.get(key) || 0 });
  }
  return result;
};

export const topSellingProducts = async (limit = 5) => {
  return Invoice.aggregate([
    { $match: { status: 'issued' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        sku: { $first: '$items.sku' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: limit },
  ]);
};

export const salesByCategory = async () => {
  return Invoice.aggregate([
    { $match: { status: 'issued' } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category._id',
        name: { $first: '$category.name' },
        total: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { total: -1 } },
  ]);
};

export const recentInvoices = async (limit = 8) => {
  return Invoice.find({ status: { $ne: 'draft' } })
    .sort({ issuedAt: -1 })
    .limit(limit)
    .populate('customer', 'name');
};

export const lowStockList = async (limit = 10) => {
  return Product.find({
    status: 'active',
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  })
    .sort({ stock: 1 })
    .limit(limit)
    .populate('category', 'name');
};