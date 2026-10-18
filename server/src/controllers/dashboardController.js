import * as service from '../services/dashboardService.js';
import { send } from '../utils/ApiResponse.js';

export const summary = async (req, res) => {
  send(res, 200, await service.summary());
};

export const salesLast30Days = async (req, res) => {
  send(res, 200, { data: await service.salesLast30Days() });
};

export const topSellingProducts = async (req, res) => {
  send(res, 200, { data: await service.topSellingProducts(5) });
};

export const salesByCategory = async (req, res) => {
  send(res, 200, { data: await service.salesByCategory() });
};

export const recentInvoices = async (req, res) => {
  send(res, 200, { invoices: await service.recentInvoices(8) });
};

export const lowStock = async (req, res) => {
  send(res, 200, { products: await service.lowStockList(10) });
};

export const all = async (req, res) => {
  const [summary, sales, top, byCategory, recent, low] = await Promise.all([
    service.summary(),
    service.salesLast30Days(),
    service.topSellingProducts(5),
    service.salesByCategory(),
    service.recentInvoices(8),
    service.lowStockList(10),
  ]);
  send(res, 200, { summary, sales, top, byCategory, recent, low });
};