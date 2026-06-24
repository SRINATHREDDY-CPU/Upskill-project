const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const revenueResult = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const totalRevenue = revenueResult[0]?.total || 0;
    res.json({ totalOrders, totalCustomers, totalRevenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
