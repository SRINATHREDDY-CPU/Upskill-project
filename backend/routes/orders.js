const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');

const DELIVERY_BOYS = [
  { id: 1, name: 'Ravi Kumar', phone: '+91 98765 43210', rating: 4.8, avatar: 'RK' },
  { id: 2, name: 'Suresh Yadav', phone: '+91 87654 32109', rating: 4.6, avatar: 'SY' },
  { id: 3, name: 'Arjun Reddy', phone: '+91 76543 21098', rating: 4.9, avatar: 'AR' }
];
const ORDER_STATUSES = ['Order Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

function generateOrderId() { return 'GS' + Date.now().toString().slice(-6); }

// POST /api/orders (place order)
router.post('/', protect, async (req, res) => {
  try {
    const { items, address, couponCode } = req.body;
    if (!items || !items.length || !address) return res.status(400).json({ message: 'Items and address are required' });

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon && subtotal >= coupon.minOrder) {
        discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.discount / 100) : coupon.discount;
        appliedCoupon = coupon;
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { used: 1 } });
      }
    }

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const total = subtotal - discount + deliveryFee;
    const deliveryBoy = DELIVERY_BOYS[Math.floor(Math.random() * DELIVERY_BOYS.length)];

    const order = await Order.create({
      orderId: generateOrderId(),
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userPhone: req.user.phone,
      items,
      subtotal,
      discount,
      deliveryFee,
      total,
      coupon: appliedCoupon ? appliedCoupon.code : null,
      deliveryBoy,
      address,
      status: 'Order Placed',
      statusIndex: 0
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my — user's orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id — single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/rate
router.put('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findOneAndUpdate({ orderId: req.params.id, user: req.user._id }, { rating, review }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders (admin — all orders)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const newIndex = Math.min(order.statusIndex + 1, ORDER_STATUSES.length - 1);
    order.statusIndex = newIndex;
    order.status = ORDER_STATUSES[newIndex];
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
