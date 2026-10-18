import * as service from '../services/productService.js';
import { send } from '../utils/ApiResponse.js';

export const list = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await service.list({
    page,
    limit,
    search: req.query.search || '',
    category: req.query.category,
    stockStatus: req.query.stockStatus,
    sort: req.query.sort || '-createdAt',
  });
  send(res, 200, result);
};

export const listAll = async (req, res) => {
  const products = await service.listAll({
    search: req.query.search || '',
    category: req.query.category,
    stockStatus: req.query.stockStatus,
  });
  send(res, 200, { products });
};

export const get = async (req, res) => {
  const product = await service.getById(req.params.id);
  send(res, 200, { product });
};

export const create = async (req, res) => {
  const product = await service.create(req.body);
  send(res, 201, { product }, 'Product created');
};

export const update = async (req, res) => {
  const product = await service.update(req.params.id, req.body);
  send(res, 200, { product }, 'Product updated');
};

export const remove = async (req, res) => {
  await service.remove(req.params.id);
  send(res, 200, null, 'Product deleted');
};