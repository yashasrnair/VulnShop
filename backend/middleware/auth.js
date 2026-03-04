// middleware/auth.js
// ⚠️ VULNERABILITIES:
//   A01: Admin check only looks at JWT payload — payload can be forged
//   A02: Same weak secret

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'secret123';

// ============================================================
// authMiddleware
// A01: Token verified but isAdmin pulled from TOKEN payload
//      Attacker who cracks/forges token gets admin
// ============================================================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
              || req.query.token          // A01: token in URL query string
              || req.body.token;          // A01: token in POST body

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // A02: Also accepts unsigned tokens if algorithm=none (older jwt libs)
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};

// ============================================================
// adminMiddleware
// A01: IDOR — checks JWT claim, not DB. JWT claim can be manipulated.
//      No server-side role check against database.
// ============================================================
const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.decode(token); // ⚠️ decode() NOT verify()! No signature check!
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin only' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authMiddleware, adminMiddleware };
