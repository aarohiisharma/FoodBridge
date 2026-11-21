const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const createPickupValidation = validate([
  body('donation_id').isInt({ min: 1 }).withMessage('Donation ID must be a positive integer'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or fewer'),
]);

const pickupIdValidation = validate([
  param('id').isInt({ min: 1 }).withMessage('Pickup ID must be a positive integer'),
]);

const pickupStatusValidation = validate([
  param('id').isInt({ min: 1 }).withMessage('Pickup ID must be a positive integer'),
  body('status').trim().toUpperCase()
    .isIn(['APPROVED', 'REJECTED', 'CANCELLED', 'ASSIGNED', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED'])
    .withMessage('Invalid pickup status'),
  body('volunteer_id').optional().isInt({ min: 1 })
    .withMessage('Volunteer ID must be a positive integer'),
]);

module.exports = {
  createPickupValidation,
  pickupIdValidation,
  pickupStatusValidation,
};
