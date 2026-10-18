import * as service from '../services/userService.js';
import { send } from '../utils/ApiResponse.js';

export const list = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const search = req.query.search || '';
  const result = await service.list({ page, limit, search });
  send(res, 200, result);
};

export const get = async (req, res) => {
  const user = await service.getById(req.params.id);
  send(res, 200, { user });
};

export const update = async (req, res) => {
  const user = await service.update(req.params.id, req.body);
  send(res, 200, { user }, 'User updated');
};

export const remove = async (req, res) => {
  await service.remove(req.params.id);
  send(res, 200, null, 'User deleted');
};