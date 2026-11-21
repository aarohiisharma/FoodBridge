const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');

const FOOD_TYPES = ['COOKED', 'PACKAGED', 'RAW', 'BAKERY', 'FRUIT_VEG', 'DAIRY', 'OTHER'];

const createDonationValidation = validate([
  body('food_name').trim().notEmpty().withMessage('Food name is required')
    .isLength({ max: 150 }).withMessage('Food name must be 150 characters or fewer'),
  body('food_type').trim().toUpperCase().isIn(FOOD_TYPES)
    .withMessage(`Food type must be one of: ${FOOD_TYPES.join(', ')}`),
  body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be positive'),
  body('quantity_unit').trim().notEmpty().withMessage('Quantity unit is required')
    .isLength({ max: 30 }).withMessage('Quantity unit must be 30 characters or fewer'),
  body('preparation_time').isISO8601().withMessage('Preparation time must be a valid ISO 8601 date'),
  body('expiry_time').isISO8601().withMessage('Expiry time must be a valid ISO 8601 date'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or fewer'),
  body('pickup_location').trim().notEmpty().withMessage('Pickup location is required')
    .isLength({ max: 255 }).withMessage('Pickup location must be 255 characters or fewer'),
  body('image_url').optional({ nullable: true }).trim().isURL()
    .withMessage('Image URL must be a valid URL'),
  body('expiry_time').custom((expiryTime, { req }) => {
    if (!req.body.preparation_time) return true;
    return new Date(expiryTime) > new Date(req.body.preparation_time);
  }).withMessage('Expiry time must be later than preparation time'),
]);

const updateDonationValidation = validate([
  param('id').isInt({ min: 1 }).withMessage('Donation ID must be a positive integer'),
  body().custom((body) => Object.keys(body).length > 0)
    .withMessage('At least one donation field is required'),
  body('food_name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('food_type').optional().trim().toUpperCase().isIn(FOOD_TYPES),
  body('quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be positive'),
  body('quantity_unit').optional().trim().notEmpty().isLength({ max: 30 }),
  body('preparation_time').optional().isISO8601(),
  body('expiry_time').optional().isISO8601(),
  body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  body('pickup_location').optional().trim().notEmpty().isLength({ max: 255 }),
  body('image_url').optional({ nullable: true }).trim().isURL(),
  body('status').optional().trim().toUpperCase()
    .isIn(['AVAILABLE', 'CLAIMED', 'COMPLETED', 'CANCELLED']),
  body('expiry_time').optional().custom((expiryTime, { req }) => {
    if (!req.body.preparation_time) return true;
    return new Date(expiryTime) > new Date(req.body.preparation_time);
  }).withMessage('Expiry time must be later than preparation time'),
]);

const donationIdValidation = validate([
  param('id').isInt({ min: 1 }).withMessage('Donation ID must be a positive integer'),
]);

const donationFiltersValidation = validate([
  query('search').optional().trim().isLength({ max: 150 }),
  query('food_type').optional().trim().toUpperCase().isIn(FOOD_TYPES),
  query('quantity_min').optional().isFloat({ min: 0 }),
  query('quantity_max').optional().isFloat({ min: 0 }),
  query('quantity_unit').optional().trim().isLength({ max: 30 }),
  query('location').optional().trim().isLength({ max: 255 }),
  query('expiry_before').optional().isISO8601(),
  query('expiry_after').optional().isISO8601(),
]);

module.exports = {
  createDonationValidation,
  updateDonationValidation,
  donationIdValidation,
  donationFiltersValidation,
};
