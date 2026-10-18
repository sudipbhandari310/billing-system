import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import ApiError from '../utils/ApiError.js';

export const list = async ({ page = 1, limit = 20, search = '' }) => {
  const query = {};
  if (search) {
    const r = new RegExp(search, 'i');
    query.$or = [{ name: r }, { phone: r }, { email: r }];
  }
  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { total, page, limit, customers };
};

export const getById = async (id) => {
  const c = await Customer.findById(id);
  if (!c) throw new ApiError(404, 'Customer not found');
  return c;
};

export const create = async (data) => Customer.create(data);

export const update = async (id, data) => {
  const c = await Customer.findById(id);
  if (!c) throw new ApiError(404, 'Customer not found');
  Object.assign(c, data);
  await c.save();
  return c;
};

export const remove = async (id) => {
  const c = await Customer.findById(id);
  if (!c) throw new ApiError(404, 'Customer not found');
  await c.deleteOne();
};

export const invoiceHistory = async (customerId) => {
  const invoices = await Invoice.find({ customer: customerId })
    .sort({ issuedAt: -1 })
    .limit(100);
  return invoices;
};