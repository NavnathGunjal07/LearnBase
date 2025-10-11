import { body, ValidationChain } from 'express-validator';

export const registerValidation: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const loginValidation: ValidationChain[] = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createTopicValidation: ValidationChain[] = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('difficulty').optional().isIn(['basic', 'intermediate', 'advanced']),
  body('iconUrl').optional().trim(),
];

export const updateUserValidation: ValidationChain[] = [
  body('name').optional().trim().notEmpty(),
  body('skillLevel').optional().trim(),
  body('currentLanguage').optional().trim(),
];
