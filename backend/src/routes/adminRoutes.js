const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const controllers = require('../controllers/remainingControllers');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/stats', controllers.getAdminStats);
router.get('/users', controllers.getRegisteredUsers);
router.get('/ngos', controllers.getNgos);
router.get('/donations', controllers.getAdminDonations);
router.patch('/ngos/:id/verification', controllers.updateNgoVerification);

module.exports = router;
