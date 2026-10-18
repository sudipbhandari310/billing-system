import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import StockMovement from '../models/StockMovement.js';
import ApiError from '../utils/ApiError.js';

const computeTotals = (items, discount = 0, taxPercent = 0) => {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const discounted = Math.max(0, subtotal - (discount || 0));
  const taxAmount = +((discounted * (taxPercent || 0)) / 100).toFixed(2);
  const grandTotal = +(discounted + taxAmount).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), taxAmount, grandTotal };
};

const paymentStatusFrom = (amountPaid, grandTotal) => {
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid >= grandTotal) return 'paid';
  return 'partial';
};

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const regex = new RegExp(`^${prefix}(\\d{4,})$`);
  const latest = await Invoice.findOne({ invoiceNumber: { $regex: regex } })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');
  let next = 1;
  if (latest && latest.invoiceNumber) {
    const m = latest.invoiceNumber.match(regex);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `${prefix}${String(next).padStart(4, '0')}`;
};

export const create = async (payload, userId) => {
  const session = await mongoose.startSession();
  try {
    let savedInvoice;
    await session.withTransaction(async () => {
      const customer = await Customer.findById(payload.customer).session(session);
      if (!customer) throw new ApiError(404, 'Customer not found');

      const productIds = payload.items.map((i) => i.product);
      const products = await Product.find({ _id: { $in: productIds } })
        .populate('category', 'name')
        .session(session);

      if (products.length !== productIds.length) {
        throw new ApiError(400, 'One or more products not found');
      }

      const items = payload.items.map((row) => {
        const product = products.find((p) => p._id.toString() === row.product);
        if (!product) throw new ApiError(400, `Product not found: ${row.product}`);
        if (product.stock < row.quantity) {
          throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
        const price = row.price != null ? row.price : product.sellingPrice;
        const lineTotal = +(price * row.quantity).toFixed(2);
        return {
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: row.quantity,
          price,
          lineTotal,
        };
      });

      const totals = computeTotals(items, payload.discount || 0, payload.taxPercent || 0);
      const amountPaid = +(payload.amountPaid || 0).toFixed(2);
      const balanceDue = +(totals.grandTotal - amountPaid).toFixed(2);

      const invoiceNumber = await generateInvoiceNumber();
      const status = payload.status && ['draft', 'issued'].includes(payload.status) ? payload.status : 'issued';

      const [invoice] = await Invoice.create(
        [
          {
            invoiceNumber,
            customer: customer._id,
            items,
            subtotal: totals.subtotal,
            discount: payload.discount || 0,
            taxPercent: payload.taxPercent || 0,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            amountPaid,
            balanceDue,
            paymentStatus: paymentStatusFrom(amountPaid, totals.grandTotal),
            status,
            notes: payload.notes || '',
            createdBy: userId,
          },
        ],
        { session }
      );
      savedInvoice = invoice;

      if (status === 'issued') {
        for (const item of items) {
          const p = await Product.findById(item.product).session(session);
          p.stock -= item.quantity;
          await p.save({ session });
          await StockMovement.create(
            [
              {
                product: p._id,
                type: 'OUT',
                quantity: item.quantity,
                reason: `Sold via ${invoiceNumber}`,
                reference: { type: 'invoice', id: invoice._id, model: 'Invoice' },
                user: userId,
              },
            ],
            { session }
          );
        }
      }
    });
    return await Invoice.findById(savedInvoice._id)
      .populate('customer', 'name email phone address')
      .populate('createdBy', 'name email');
  } finally {
    session.endSession();
  }
};

export const list = async ({ page = 1, limit = 20, search = '', status, paymentStatus, from, to }) => {
  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (from || to) {
    query.issuedAt = {};
    if (from) query.issuedAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.issuedAt.$lte = end;
    }
  }
  if (search) {
    const r = new RegExp(search, 'i');
    const customers = await Customer.find({ $or: [{ name: r }, { phone: r }, { email: r }] }).select('_id');
    query.$or = [{ invoiceNumber: r }, { customer: { $in: customers.map((c) => c._id) } }];
  }
  const total = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .populate('customer', 'name phone email')
    .sort({ issuedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { total, page, limit, invoices };
};

export const getById = async (id) => {
  const inv = await Invoice.findById(id)
    .populate('customer', 'name phone email address')
    .populate('createdBy', 'name email');
  if (!inv) throw new ApiError(404, 'Invoice not found');
  return inv;
};

export const cancel = async (id, userId) => {
  const session = await mongoose.startSession();
  try {
    let invoice;
    await session.withTransaction(async () => {
      invoice = await Invoice.findById(id).session(session);
      if (!invoice) throw new ApiError(404, 'Invoice not found');
      if (invoice.status === 'cancelled') throw new ApiError(400, 'Invoice already cancelled');

      if (invoice.status === 'issued') {
        for (const item of invoice.items) {
          const p = await Product.findById(item.product).session(session);
          if (p) {
            p.stock += item.quantity;
            await p.save({ session });
            await StockMovement.create(
              [
                {
                  product: p._id,
                  type: 'IN',
                  quantity: item.quantity,
                  reason: `Cancelled invoice ${invoice.invoiceNumber}`,
                  reference: { type: 'invoice', id: invoice._id, model: 'Invoice' },
                  user: userId,
                },
              ],
              { session }
            );
          }
        }
      }
      invoice.status = 'cancelled';
      await invoice.save({ session });
    });
    return await Invoice.findById(invoice._id)
      .populate('customer', 'name phone email address')
      .populate('createdBy', 'name email');
  } finally {
    session.endSession();
  }
};

export const updatePayment = async (id, amountPaid) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (invoice.status === 'cancelled') throw new ApiError(400, 'Cancelled invoices cannot accept payments');
  invoice.amountPaid = +amountPaid.toFixed(2);
  invoice.balanceDue = +(invoice.grandTotal - invoice.amountPaid).toFixed(2);
  invoice.paymentStatus = paymentStatusFrom(invoice.amountPaid, invoice.grandTotal);
  await invoice.save();
  return invoice;
};

export { computeTotals, generateInvoiceNumber };