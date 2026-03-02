import { body, param, query, validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createTestRules = [
  body('url').isURL({ require_protocol: true }).withMessage('Valid URL with protocol required'),
  body('config').optional().isObject().withMessage('Config must be an object'),
];

export const playbookRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  body('authType').trim().notEmpty().withMessage('Auth type is required'),
];

export const uuidParam = [
  param('id').isUUID().withMessage('Invalid ID format'),
];
