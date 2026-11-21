const { body } = require('express-validator');
const validate = require('../middleware/validate');

const registerValidation = validate([
  body('name').trim().notEmpty().withMessage('Name is required').bail()
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer'),
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role')
    .isIn(['DONOR', 'NGO', 'VOLUNTEER', 'donor', 'ngo', 'volunteer'])
    .withMessage('Role must be DONOR, NGO, or VOLUNTEER'),
  body('ngoOrganizationName')
    .if(body('role').isIn(['NGO', 'ngo']))
    .trim()
    .notEmpty()
    .withMessage('NGO organization name is required'),
  body('ngoRegistrationNumber')
    .if(body('role').isIn(['NGO', 'ngo']))
    .trim()
    .notEmpty()
    .withMessage('NGO registration number is required'),
]);

const loginValidation = validate([
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]);

const profileValidation = validate([
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer'),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 30 })
    .withMessage('Phone must be 30 characters or fewer'),
  body('address').optional({ nullable: true }).trim().isLength({ max: 255 })
    .withMessage('Address must be 255 characters or fewer'),
]);

module.exports = { registerValidation, loginValidation, profileValidation };
