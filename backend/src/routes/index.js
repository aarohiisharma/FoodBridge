const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const donationRoutes = require('./donationRoutes');
const pickupRoutes = require('./pickupRoutes');
const volunteerRoutes = require('./volunteerRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/donations', donationRoutes);
router.use('/pickups', pickupRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
