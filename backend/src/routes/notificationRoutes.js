const express = require('express');
const authenticate = require('../middleware/authenticate');
const controllers = require('../controllers/remainingControllers');

const router = express.Router();

router.use(authenticate);
router.get('/', controllers.getNotifications);
router.patch('/:id/read', controllers.markNotificationRead);

module.exports = router;
