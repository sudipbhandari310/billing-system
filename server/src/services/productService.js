import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

export const STOCK_STATUS = {
  in_stock: { $expr: { $gt: ['$stock', '$lowStockThreshold'] } },
  low_stock: {
    $and: [
      { $gt: ['$stock', 0] },
      { $lte: ['$stock', '$lowStockThreshold'] },
    ],
  },
  out_of_stock: { $lte: ['$stock', 0] },
};

export const list = async ({
  page = 1,
  limit = 20,
  search = '',
  category,
  stockStatus,
  sort = '-createdAt',
}) => {
  const query = {};
  if (search) {
    const r = new RegExp(search, 'i');
    query.$or = [{ name: r }, { sku: r }];
  }
  if (category) query.category = category;
  if (stockStatus && STOCK_STATUS[stockStatus]) {
    Object.assign(query, STOCK_STATUS[stockStatus]);
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  return { total, page, limit, products };
};

export const listAll = async ({ search = '', category, stockStatus } = {}) => {
  const query = {};
  if (search) {
    const r = new RegExp(search, 'i');
    query.$or = [{ name: r }, { sku: r }];
  }
  if (category) query.category = category;
  if (stockStatus && STOCK_STATUS[stockStatus]) Object.assign(query, STOCK_STATUS[stockStatus]);
  return Product.find(query).populate('category', 'name').sort('name');
};

export const getById = async (id) => {
  const p = await Product.findById(id).populate('category', 'name');
  if (!p) throw new ApiError(404, 'Product not found');
  return p;
};

export const create = async (data) => {
  if (data.sku) data.sku = data.sku.toUpperCase();
  return Product.create(data);
};

export const update = async (id, data) => {
  if (data.sku) data.sku = data.sku.toUpperCase();
  const p = await Product.findById(id);
  if (!p) throw new ApiError(404, 'Product not found');
  Object.assign(p, data);
  await p.save();
  return p;
};

export const remove = async (id) => {
  const p = await Product.findById(id);
  if (!p) throw new ApiError(404, 'Product not found');
  await p.deleteOne();
};