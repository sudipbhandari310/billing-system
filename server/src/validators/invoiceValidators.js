import { body } from 'express-validator';

const itemValidator = body('items').isArray({ min: 1 }).withMessage('At least one item is required');

export const createInvoiceValidator = [
  body('customer').notEmpty().isMongoId().withMessage('Valid customer is required'),
  itemValidator,
  body('items.*.product').isMongoId().withMessage('Valid product id required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('discount').optional().isFloat({ min: 0 }),
  body('taxPercent').optional().isFloat({ min: 0, max: 100 }),
  body('amountPaid').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['draft', 'issued', 'cancelled']),
  body('notes').optional().isString().isLength({ max: 500 }),
];

export const updatePaymentValidator = [
  body('amountPaid').isFloat({ min: 0 }).withMessage('amountPaid must be >= 0'),
];