const express = require('express');
const pickupController = require('../controllers/pickupController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  createPickupValidation,
  pickupIdValidation,
  pickupStatusValidation,
} = require('../validators/pickupValidators');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('NGO'),
  createPickupValidation,
  pickupController.createPickup,
);
router.get(
  '/',
  authenticate,
  pickupController.listPickups,
);
router.get(
  '/my',
  authenticate,
  pickupController.listPickups,
);
router.patch(
  '/:id/status',
  authenticate,
  pickupStatusValidation,
  pickupController.updateStatus,
);
router.delete(
  '/:id',
  authenticate,
  authorize('NGO'),
  pickupIdValidation,
  pickupController.cancelPickup,
);

module.exports = router;
