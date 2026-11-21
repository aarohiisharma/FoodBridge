const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const controllers = require('../controllers/remainingControllers');

const router = express.Router();

router.use(authenticate, authorize('VOLUNTEER'));
router.get('/tasks', controllers.getVolunteerTasks);
router.get('/tasks/assigned', controllers.getAssignedTasks);
router.patch('/tasks/:id/accept', controllers.acceptVolunteerTask);
router.patch('/tasks/:id/decline', controllers.declineVolunteerTask);
router.patch('/tasks/:id/status', controllers.updateVolunteerTask);

module.exports = router;
