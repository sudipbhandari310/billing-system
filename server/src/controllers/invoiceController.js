import * as service from '../services/invoiceService.js';
import { streamInvoice } from '../utils/pdf.js';
import { streamInvoicesCsv } from '../utils/csv.js';
import { send } from '../utils/ApiResponse.js';

export const create = async (req, res) => {
  const invoice = await service.create(req.body, req.user._id);
  send(res, 201, { invoice }, 'Invoice created');
};

export const list = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await service.list({
    page,
    limit,
    search: req.query.search || '',
    status: req.query.status,
    paymentStatus: req.query.paymentStatus,
    from: req.query.from,
    to: req.query.to,
  });
  send(res, 200, result);
};

export const get = async (req, res) => {
  const invoice = await service.getById(req.params.id);
  send(res, 200, { invoice });
};

export const cancel = async (req, res) => {
  const invoice = await service.cancel(req.params.id, req.user._id);
  send(res, 200, { invoice }, 'Invoice cancelled');
};

export const updatePayment = async (req, res) => {
  const invoice = await service.updatePayment(req.params.id, req.body.amountPaid);
  send(res, 200, { invoice }, 'Payment updated');
};

export const preview = async (req, res) => {
  const invoice = await service.getById(req.params.id);
  streamInvoice(res, invoice);
};

export const download = async (req, res) => {
  const invoice = await service.getById(req.params.id);
  streamInvoice(res, invoice, { download: true });
};

export const exportCsv = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1000;
  const { invoices } = await service.list({
    page,
    limit,
    search: req.query.search || '',
    status: req.query.status,
    paymentStatus: req.query.paymentStatus,
    from: req.query.from,
    to: req.query.to,
  });
  streamInvoicesCsv(res, invoices);
};