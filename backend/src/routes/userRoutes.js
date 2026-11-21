const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const { profileValidation } = require('../validators/authValidators');

const router = express.Router();

router.put('/profile', authenticate, profileValidation, userController.updateProfile);

module.exports = router;
