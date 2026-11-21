const express = require('express');
const donationController = require('../controllers/donationController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  createDonationValidation,
  updateDonationValidation,
  donationIdValidation,
  donationFiltersValidation,
} = require('../validators/donationValidators');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('DONOR'),
  createDonationValidation,
  donationController.createDonation,
);
router.get('/', donationFiltersValidation, donationController.listDonations);
router.get('/my', authenticate, authorize('DONOR'), donationController.getMyDonations);
router.get('/:id', donationIdValidation, donationController.getDonation);
router.put(
  '/:id',
  authenticate,
  authorize('DONOR'),
  updateDonationValidation,
  donationController.updateDonation,
);
router.delete(
  '/:id',
  authenticate,
  authorize('DONOR'),
  donationIdValidation,
  donationController.deleteDonation,
);

module.exports = router;
