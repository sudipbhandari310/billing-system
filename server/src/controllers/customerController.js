import * as service from '../services/customerService.js';
import { send } from '../utils/ApiResponse.js';

export const list = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await service.list({ page, limit, search: req.query.search || '' });
  send(res, 200, result);
};

export const get = async (req, res) => {
  const customer = await service.getById(req.params.id);
  send(res, 200, { customer });
};

export const create = async (req, res) => {
  const customer = await service.create(req.body);
  send(res, 201, { customer }, 'Customer created');
};

export const update = async (req, res) => {
  const customer = await service.update(req.params.id, req.body);
  send(res, 200, { customer }, 'Customer updated');
};

export const remove = async (req, res) => {
  await service.remove(req.params.id);
  send(res, 200, null, 'Customer deleted');
};

export const history = async (req, res) => {
  const invoices = await service.invoiceHistory(req.params.id);
  send(res, 200, { invoices });
};