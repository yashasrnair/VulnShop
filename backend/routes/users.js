// routes/users.js
// ⚠️ VULNERABILITIES:
//   A01: IDOR — users can read/update other users' profiles
//   A03: Mass assignment — can set isAdmin: true on self
//   A02: Password returned in API response

const express = require('express');
const router  = express.Router();
const User    = require('../models/index');
const { authMiddleware } = require('../middleware/auth');

// ============================================================
// GET /api/users
// A01: Any authenticated user can list ALL users with passwords!
// ============================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    // VULN: Returns all users including password field
    const users = await User.find({});
    res.json(users); // passwords exposed!
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/users/:id
// A01: IDOR — any user can read any other user's profile
//      including their plaintext password!
// ============================================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // VULN: No check that req.params.id === req.user.userId
    const user = await User.findById(req.params.id);
    res.json(user); // returns password
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PUT /api/users/:id
// A01: IDOR — any user can update any other user's profile
// A03: Mass assignment — sending { isAdmin: true } elevates privileges
//      Try: PUT /api/users/YOUR_ID with body { "isAdmin": true }
// ============================================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // VULN 1: No ownership check
    // VULN 2: req.body passed directly → mass assignment
    // Attack: { "isAdmin": true, "role": "admin" }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,       // ← MASS ASSIGNMENT!
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE /api/users/:id
// A01: Any user can delete any account
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
