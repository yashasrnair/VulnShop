// routes/orders.js
// ⚠️ VULNERABILITIES:
//   A01: IDOR — users can view/cancel other users' orders
//   A04: Insecure Design — price comes from client, not server
//   A01: No authorization checks on order modification

const express = require('express');
const router  = express.Router();
const { Order, Product } = require('../models/index');
const { authMiddleware } = require('../middleware/auth');

// ============================================================
// GET /api/orders
// A01: Returns ALL orders to any authenticated user
//      Should only return user's own orders
// ============================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    // VULN: No filter by userId — returns ALL orders
    const orders = await Order.find({});
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/orders/:id
// A01: IDOR — any user can get any order by guessing/knowing ID
// ============================================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // VULN: No check that order belongs to req.user.userId
    const order = await Order.findById(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/orders
// A04: Insecure Design — total price sent from frontend
//      Attacker can submit order with total: 0.01
// A03: Mass assignment via strict:false model
// ============================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { products, total, address, ...rest } = req.body;

    // VULN: Price from client — should be computed server-side from DB
    // Attacker can set total to any value, even negative
    const order = new Order({
      userId: req.user.userId,
      products,
      total,      // ← TRUSTING CLIENT FOR PRICE!
      address,
      status: 'pending',
      ...rest     // mass assignment
    });

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PUT /api/orders/:id/status
// A01: Any user can change any order's status
//      Including changing someone else's order to 'refunded'
// ============================================================
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    // VULN: No ownership check, no role check
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE /api/orders/:id
// A01: Any user can delete any order
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id); // no ownership check
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
