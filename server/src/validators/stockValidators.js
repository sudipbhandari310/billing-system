import { body } from 'express-validator';

export const adjustValidator = [
  body('product').notEmpty().isMongoId(),
  body('type').isIn(['IN', 'OUT', 'ADJUST']),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reason').optional().isString().isLength({ max: 300 }),
];