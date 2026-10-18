import * as service from '../services/categoryService.js';
import { send } from '../utils/ApiResponse.js';

export const list = async (req, res) => {
  const categories = await service.list({ search: req.query.search || '' });
  send(res, 200, { categories });
};

export const create = async (req, res) => {
  const category = await service.create(req.body);
  send(res, 201, { category }, 'Category created');
};

export const update = async (req, res) => {
  const category = await service.update(req.params.id, req.body);
  send(res, 200, { category }, 'Category updated');
};

export const remove = async (req, res) => {
  await service.remove(req.params.id);
  send(res, 200, null, 'Category deleted');
};