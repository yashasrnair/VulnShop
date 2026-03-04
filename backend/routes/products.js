// routes/products.js
// ⚠️ VULNERABILITIES:
//   A03: NoSQL Injection in search
//   A03: Stored XSS via product description
//   A01: IDOR - any user can edit/delete any product by ID
//   A04: Unrestricted file upload

const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const { Product } = require('../models/index');
const { authMiddleware } = require('../middleware/auth');

// ============================================================
// A04:2021 – Insecure Design / Unrestricted File Upload
// multer accepts any file type, stores with original extension
// Attacker can upload .js, .html, .php files
// ============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // VULN: Original filename used → path traversal, overwrite system files
    cb(null, file.originalname);
  }
});
const upload = multer({
  storage,
  // No file type validation!
  // No file size limit!
});

// ============================================================
// GET /api/products
// A03: NoSQL injection in search — ?search={"$gt":""}
//      or ?search[$regex]=.*&search[$options]=i
// ============================================================
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      // VULN: User input directly in query — NoSQL injection
      query = {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { category: req.query.search }
        ]
      };
    }
    // A03: Also allows filter by any field via query params
    // e.g. ?price[$gt]=0 returns all products
    const extraFilters = { ...req.query };
    delete extraFilters.search;
    Object.assign(query, extraFilters);

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ============================================================
// GET /api/products/:id
// A01: IDOR — no ownership check
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/products
// A03: Stored XSS — description saved raw, rendered as innerHTML on frontend
// A03: Mass assignment — any field accepted (strict:false)
// ============================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    // VULN: req.body used directly — mass assignment
    // Attacker can set createdBy, _id, etc.
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PUT /api/products/:id
// A01: IDOR — any logged-in user can edit ANY product
//      No check that user owns the product
// ============================================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // VULN: No ownership verification — any user can update any product
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,    // mass assignment too
      { new: true }
    );
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE /api/products/:id
// A01: Any authenticated user can delete any product
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id); // no ownership check
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/products/upload
// A04: Unrestricted file upload — no MIME type check
//      Uploads stored in web-accessible /uploads folder
//      .html files served as HTML → XSS via file upload
// ============================================================
router.post('/upload/image', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({
    message: 'File uploaded',
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    size: req.file.size,
    // VULN: Returns full server path
    serverPath: req.file.path
  });
});

// ============================================================
// GET /api/products/file/read
// A01: Path Traversal — reads arbitrary files from server
//      ?file=../../.env  reads environment variables
//      ?file=../../etc/passwd reads system files
// ============================================================
router.get('/file/read', (req, res) => {
  const filename = req.query.file;
  // VULN: No sanitization of path
  const filePath = path.join(__dirname, '../uploads', filename);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: err.message, path: filePath });
    res.send(data);
  });
});

module.exports = router;
