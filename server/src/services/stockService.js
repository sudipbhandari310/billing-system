import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import ApiError from '../utils/ApiError.js';

export const adjust = async ({ productId, type, quantity, reason }, userId) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw new ApiError(404, 'Product not found');

      let newStock = product.stock;
      if (type === 'IN') newStock += quantity;
      else if (type === 'OUT') {
        if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock for OUT movement');
        newStock -= quantity;
      } else if (type === 'ADJUST') {
        newStock = quantity;
      }

      product.stock = newStock;
      await product.save({ session });

      const [movement] = await StockMovement.create(
        [
          {
            product: product._id,
            type,
            quantity,
            reason: reason || 'Manual adjustment',
            reference: { type: 'manual' },
            user: userId,
          },
        ],
        { session }
      );
      result = movement;
    });
    return await StockMovement.findById(result._id).populate('product', 'name sku').populate('user', 'name');
  } finally {
    session.endSession();
  }
};

export const list = async ({ page = 1, limit = 30, product, type }) => {
  const query = {};
  if (product) query.product = product;
  if (type) query.type = type;
  const total = await StockMovement.countDocuments(query);
  const movements = await StockMovement.find(query)
    .populate('product', 'name sku')
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { total, page, limit, movements };
};