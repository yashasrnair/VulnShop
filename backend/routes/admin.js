// routes/admin.js
// ⚠️ VULNERABILITIES:
//   A01: Admin middleware uses jwt.decode() NOT jwt.verify()
//   A03: Command injection in system ping endpoint
//   A06: Components with known vulnerabilities (node-serialize)
//   A09: No audit logging

const express = require('express');
const router  = express.Router();
const { exec } = require('child_process');
const User    = require('../models/index');
const { Product } = require('../models/index');
const { adminMiddleware } = require('../middleware/auth');

// ============================================================
// GET /api/admin/users
// A01: adminMiddleware uses jwt.decode (no signature verification!)
//      Forge a JWT with { isAdmin: true } and get access
// ============================================================
router.get('/users', adminMiddleware, async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// ============================================================
// POST /api/admin/ping
// A03:2021 – Injection — OS Command Injection
//   Input: "localhost; cat /etc/passwd"
//   Input: "localhost && whoami"
//   Input: "localhost | ls -la /"
// ============================================================
router.post('/ping', adminMiddleware, (req, res) => {
  const { host } = req.body;

  // VULN: User input concatenated directly into shell command
  exec(`ping -c 3 ${host}`, (error, stdout, stderr) => {
    res.json({
      command: `ping -c 3 ${host}`,  // reveals command to user
      output: stdout,
      error: stderr
    });
  });
});

// ============================================================
// POST /api/admin/backup
// A03: Path traversal / command injection in filename
// ============================================================
router.post('/backup', adminMiddleware, (req, res) => {
  const { filename } = req.body;
  // VULN: filename not sanitized
  exec(`cp -r ./uploads ./backups/${filename}`, (err, stdout) => {
    res.json({ message: `Backup saved as ${filename}`, output: stdout });
  });
});

// ============================================================
// GET /api/admin/stats
// A09:2021 – Security Logging and Monitoring Failures
// No logging of who accessed what, no audit trail
// ============================================================
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const userCount    = await User.countDocuments();
    const productCount = await Product.countDocuments();
    res.json({
      users: userCount,
      products: productCount,
      serverTime: new Date(),
      // A05: Sensitive info in response
      dbConnection: 'mongodb://localhost:27017/vulnshop',
      nodeEnv: process.env.NODE_ENV,
      allEnvVars: process.env
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/admin/deserialize
// A08:2021 – Software and Data Integrity Failures
//   Insecure deserialization → Remote Code Execution
//   Payload: {"rce":"_$$ND_FUNC$$_function(){require('child_process').exec('calc')}()"}
// ============================================================
router.post('/deserialize', (req, res) => {
  const nodeSerialize = require('node-serialize');
  try {
    // VULN: Deserializes untrusted data — RCE possible
    const obj = nodeSerialize.unserialize(JSON.stringify(req.body));
    res.json({ result: obj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
