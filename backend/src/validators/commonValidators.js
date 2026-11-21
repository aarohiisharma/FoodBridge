const { body, param, query } = require('express-validator');

const commonValidators = {
  idParam: param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  email: body('email').trim().isEmail().withMessage('A valid email is required'),
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
};

module.exports = { commonValidators, body, param, query };
