// ⚠️  VULNSHOP - DELIBERATELY VULNERABLE APPLICATION ⚠️
// FOR EDUCATIONAL PURPOSES ONLY — DO NOT DEPLOY TO PRODUCTION
// Demonstrates OWASP Top 10 (2021) vulnerabilities

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();

// ============================================================
// VULN A05:2021 - Security Misconfiguration
// - CORS allows ALL origins with credentials
// - Detailed error messages exposed
// - No security headers (no helmet)
// ============================================================
app.use(cors({
  origin: true,           // reflects any origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*'
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files with directory listing enabled (misconfiguration)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'allow',    // serves .env, .htaccess etc
  index: true           // enables directory listing
}));

// ============================================================
// A05 - Verbose error handler (stack traces exposed)
// ============================================================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: err.message,
    stack: err.stack,       // stack trace sent to client!
    query: req.query,
    body: req.body
  });
});

// ============================================================
// MongoDB connection - A05: hardcoded credentials
// ============================================================
const MONGO_URI = 'your mongo db url '; // no auth
mongoose.connect(MONGO_URI)
  .then(() => console.log('[*] MongoDB connected:', MONGO_URI))
  .catch(err => console.error('MongoDB error:', err));

// ============================================================
// Routes
// ============================================================
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/comments', require('./routes/comments'));

// ============================================================
// A05 - Server info disclosure
// ============================================================
app.get('/api/debug', (req, res) => {
  res.json({
    nodeVersion: process.version,
    env: process.env,           // ALL env variables exposed!
    cwd: process.cwd(),
    platform: process.platform,
    memory: process.memoryUsage()
  });
});

// A05 - XML/JSON processing with XXE-like behavior
app.post('/api/import', express.text({ type: '*/*' }), (req, res) => {
  // VULN A08: Insecure deserialization
  try {
    const nodeSerialize = require('node-serialize');
    const data = nodeSerialize.unserialize(req.body); // RCE possible
    res.json({ imported: data });
  } catch(e) {
    res.json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   ⚠️  VULNSHOP - DELIBERATELY VULNERABLE APP ⚠️ ║
║   Running on http://localhost:${PORT}            ║
║   FOR EDUCATIONAL PURPOSES ONLY                  ║
╚══════════════════════════════════════════════════╝
  `);
});
