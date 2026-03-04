// routes/auth.js
// ⚠️ VULNERABILITIES:
//   A02 - Plaintext passwords, weak JWT secret
//   A07 - No brute force protection, verbose error messages
//   A01 - JWT not validated properly on some routes
//   A03 - NoSQL Injection in login

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/index');

// ============================================================
// A02:2021 – Cryptographic Failures
// - Hardcoded weak JWT secret
// - Passwords stored in plaintext
// - No HTTPS enforcement
// ============================================================
const JWT_SECRET = 'secret123'; // hardcoded weak secret

// ============================================================
// POST /api/auth/register
// A02: password stored as plaintext (no hashing)
// A03: no input sanitization → mass assignment via strict:false
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, ...rest } = req.body;

    // A03: Mass assignment — user can send isAdmin:true and it gets saved
    const user = new User({ username, email, password, ...rest });
    await user.save();

    // A07: Username enumeration — different message if user exists
    res.json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    // A05: Stack trace exposed
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ============================================================
// POST /api/auth/login
// A03: NoSQL Injection — attacker can send {"$gt":""} as password
//      e.g. POST body: { "email": "admin@shop.com", "password": {"$gt": ""} }
// A07: No rate limiting → brute force possible
// A02: Comparing plaintext passwords
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // VULN: Query built directly from user input — NoSQL injection
    const user = await User.findOne({ email: email, password: password });

    if (!user) {
      // A07: Verbose — tells attacker whether email or password was wrong
      const emailExists = await User.findOne({ email });
      if (!emailExists) {
        return res.status(401).json({ error: 'Email not found' });
      }
      return res.status(401).json({ error: 'Wrong password' });
    }

    // A02: Weak secret, no expiry enforced
    const token = jwt.sign(
      { userId: user._id, username: user.username, isAdmin: user.isAdmin, role: user.role },
      JWT_SECRET
      // intentionally NO expiresIn
    );

    res.json({ token, user: { id: user._id, username: user.username, isAdmin: user.isAdmin } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/auth/profile
// A01: JWT decoded but signature NOT verified on some operations
// A02: User data including password hash returned
// ============================================================
router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    // ⚠️ VULN A02: Using 'none' algorithm bypass possible in some jwt versions
    // Also: full user object including password returned
    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.userId).then(user => {
      res.json(user); // returns password field too!
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// ============================================================
// POST /api/auth/forgot-password
// A01: Password reset token is predictable (timestamp-based)
// A07: No rate limiting, email enumeration
// ============================================================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: 'Email not found' }); // enumeration!
  }

  // VULN: Predictable token = just a timestamp
  const resetToken = Date.now().toString();
  user.resetToken = resetToken;
  await user.save();

  res.json({ message: 'Reset token sent', resetToken }); // token in response!
});

// ============================================================
// POST /api/auth/reset-password
// A01: Token not expired, not invalidated after use
// ============================================================
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;
  const user = await User.findOne({ resetToken }); // no expiry check!

  if (!user) return res.status(404).json({ error: 'Invalid token' });

  user.password = newPassword; // still plaintext
  // VULN: token NOT cleared after use → can be reused
  await user.save();

  res.json({ message: 'Password reset successfully' });
});

module.exports = router;
