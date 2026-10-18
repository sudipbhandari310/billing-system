import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import StockMovement from '../models/StockMovement.js';

const adminData = {
  name: process.env.SEED_ADMIN_NAME || 'Admin',
  email: (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  phone: process.env.SEED_ADMIN_PHONE || '0000000000',
  role: 'admin',
};

const staffData = {
  name: 'Staff User',
  email: 'staff@example.com',
  password: 'Staff@12345',
  phone: '1111111111',
  role: 'staff',
};

const categories = [
  { name: 'Beverages', description: 'Drinks and refreshments' },
  { name: 'Snacks', description: 'Quick bites and chips' },
  { name: 'Groceries', description: 'Everyday essentials' },
  { name: 'Electronics', description: 'Gadgets and accessories' },
  { name: 'Stationery', description: 'Office and school supplies' },
];

const products = [
  { name: 'Coca Cola 500ml', sku: 'BEV-001', category: 'Beverages', purchasePrice: 0.8, sellingPrice: 1.5, stock: 120, lowStockThreshold: 20 },
  { name: 'Mineral Water 1L', sku: 'BEV-002', category: 'Beverages', purchasePrice: 0.4, sellingPrice: 1.0, stock: 200, lowStockThreshold: 30 },
  { name: 'Orange Juice 1L', sku: 'BEV-003', category: 'Beverages', purchasePrice: 1.5, sellingPrice: 2.5, stock: 60, lowStockThreshold: 15 },
  { name: 'Potato Chips', sku: 'SNK-001', category: 'Snacks', purchasePrice: 0.5, sellingPrice: 1.2, stock: 80, lowStockThreshold: 20 },
  { name: 'Chocolate Bar', sku: 'SNK-002', category: 'Snacks', purchasePrice: 0.6, sellingPrice: 1.5, stock: 4, lowStockThreshold: 10 },
  { name: 'Mixed Nuts 200g', sku: 'SNK-003', category: 'Snacks', purchasePrice: 2.0, sellingPrice: 3.5, stock: 35, lowStockThreshold: 10 },
  { name: 'White Rice 5kg', sku: 'GRO-001', category: 'Groceries', purchasePrice: 6.0, sellingPrice: 8.5, stock: 50, lowStockThreshold: 10 },
  { name: 'Cooking Oil 1L', sku: 'GRO-002', category: 'Groceries', purchasePrice: 2.5, sellingPrice: 4.0, stock: 45, lowStockThreshold: 10 },
  { name: 'USB-C Cable', sku: 'ELC-001', category: 'Electronics', purchasePrice: 1.5, sellingPrice: 4.5, stock: 25, lowStockThreshold: 8 },
  { name: 'Wireless Mouse', sku: 'ELC-002', category: 'Electronics', purchasePrice: 5.0, sellingPrice: 12.0, stock: 0, lowStockThreshold: 5 },
  { name: 'Ballpoint Pen (10pk)', sku: 'STA-001', category: 'Stationery', purchasePrice: 1.0, sellingPrice: 2.5, stock: 100, lowStockThreshold: 20 },
  { name: 'Notebook A4', sku: 'STA-002', category: 'Stationery', purchasePrice: 1.2, sellingPrice: 3.0, stock: 70, lowStockThreshold: 15 },
];

const customers = [
  { name: 'John Doe', phone: '555-0101', email: 'john@example.com', address: '12 Oak Street' },
  { name: 'Jane Smith', phone: '555-0102', email: 'jane@example.com', address: '88 Pine Avenue' },
  { name: 'Walk-in Customer', phone: '', email: '', address: '' },
];

const seed = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Invoice.deleteMany({}),
      StockMovement.deleteMany({}),
    ]);

    console.log('Creating admin and staff users...');
    const [admin, staff] = await User.create([adminData, staffData]);
    console.log(`  Admin: ${admin.email}`);
    console.log(`  Staff: ${staff.email}`);

    console.log('Creating categories...');
    const categoryDocs = await Category.insertMany(categories);
    const catByName = Object.fromEntries(categoryDocs.map((c) => [c.name, c._id]));

    console.log('Creating products...');
    const productDocs = await Product.insertMany(
      products.map((p) => ({
        ...p,
        sku: p.sku.toUpperCase(),
        category: catByName[p.category],
      }))
    );

    console.log('Creating customers...');
    const customerDocs = await Customer.insertMany(customers);

    console.log('Creating sample invoices...');
    const productsBySku = Object.fromEntries(productDocs.map((p) => [p.sku, p]));

    const sampleInvoices = [
      {
        customerIndex: 0,
        items: [
          { sku: 'BEV-001', quantity: 2 },
          { sku: 'SNK-001', quantity: 1 },
        ],
        taxPercent: 5,
        amountPaid: 0,
      },
      {
        customerIndex: 1,
        items: [
          { sku: 'GRO-001', quantity: 1 },
          { sku: 'GRO-002', quantity: 2 },
        ],
        taxPercent: 0,
        amountPaid: 0,
      },
      {
        customerIndex: 2,
        items: [
          { sku: 'BEV-002', quantity: 3 },
          { sku: 'SNK-003', quantity: 2 },
        ],
        taxPercent: 5,
        amountPaid: 999, // marked fully paid (capped to grandTotal below)
      },
    ];

    let counter = 1;
    for (const s of sampleInvoices) {
      const items = s.items.map((it) => {
        const p = productsBySku[it.sku];
        return {
          product: p._id,
          name: p.name,
          sku: p.sku,
          quantity: it.quantity,
          price: p.sellingPrice,
          lineTotal: +(p.sellingPrice * it.quantity).toFixed(2),
        };
      });
      const subtotal = +items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);
      const taxAmount = +((subtotal * s.taxPercent) / 100).toFixed(2);
      const grandTotal = +(subtotal + taxAmount).toFixed(2);
      const requestedPaid = +(s.amountPaid || 0).toFixed(2);
      const amountPaid = Math.max(0, Math.min(grandTotal, requestedPaid));
      const balanceDue = +(grandTotal - amountPaid).toFixed(2);
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(counter).padStart(4, '0')}`;
      counter += 1;
      const paymentStatus = amountPaid <= 0 ? 'unpaid' : amountPaid >= grandTotal ? 'paid' : 'partial';

      await Invoice.create({
        invoiceNumber,
        customer: customerDocs[s.customerIndex]._id,
        items,
        subtotal,
        discount: 0,
        taxPercent: s.taxPercent,
        taxAmount,
        grandTotal,
        amountPaid,
        balanceDue,
        paymentStatus,
        status: 'issued',
        notes: 'Sample invoice',
        createdBy: admin._id,
      });

      for (const it of items) {
        const p = await Product.findById(it.product);
        p.stock = Math.max(0, p.stock - it.quantity);
        await p.save();
        await StockMovement.create({
          product: p._id,
          type: 'OUT',
          quantity: it.quantity,
          reason: `Sold via ${invoiceNumber}`,
          reference: { type: 'invoice', id: null, model: 'Invoice' },
          user: admin._id,
        });
      }
    }

    console.log('\nSeed completed.');
    console.log('Admin login:', adminData.email, '/', adminData.password);
    console.log('Staff login:', staffData.email, '/', staffData.password);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();