import { body } from 'express-validator';

export const customerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('phone').optional().isString().isLength({ max: 30 }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('address').optional().isString().isLength({ max: 300 }),
];