import * as service from '../services/stockService.js';
import { send } from '../utils/ApiResponse.js';

export const list = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;
  const result = await service.list({
    page,
    limit,
    product: req.query.product,
    type: req.query.type,
  });
  send(res, 200, result);
};

export const adjust = async (req, res) => {
  const movement = await service.adjust(req.body, req.user._id);
  send(res, 201, { movement }, 'Stock adjusted');
};