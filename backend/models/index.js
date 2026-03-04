// models/User.js
const mongoose = require('mongoose');

// ⚠️ VULN: Passwords stored as plaintext (A02: Cryptographic Failures)
// ⚠️ VULN: No input validation/sanitization
// ⚠️ VULN: isAdmin flag trivially toggled (A01: Broken Access Control)
const UserSchema = new mongoose.Schema({
  username: { type: String },       // no uniqueness enforced properly
  email:    { type: String },
  password: { type: String },       // stored as PLAINTEXT
  isAdmin:  { type: Boolean, default: false },
  role:     { type: String, default: 'user' },
  profile:  { type: Object },       // arbitrary object — mass assignment risk
  resetToken: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { strict: false }); // strict:false = any field accepted → mass assignment (A03)

module.exports = mongoose.model('User', UserSchema);


// models/Product.js
const ProductSchema = new mongoose.Schema({
  name:        String,
  description: String,   // rendered as raw HTML on frontend → XSS (A03)
  price:       Number,
  category:    String,
  stock:       Number,
  imageUrl:    String,
  createdBy:   String,
}, { strict: false });

module.exports.Product = mongoose.model('Product', ProductSchema);


// models/Order.js
const OrderSchema = new mongoose.Schema({
  userId:    String,
  products:  Array,
  total:     Number,     // sent from client, not computed server-side (A01)
  status:    String,
  address:   Object,
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

module.exports.Order = mongoose.model('Order', OrderSchema);


// models/Comment.js
const CommentSchema = new mongoose.Schema({
  productId: String,
  userId:    String,
  username:  String,
  content:   String,    // stored/rendered raw → stored XSS (A03)
  createdAt: { type: Date, default: Date.now }
});

module.exports.Comment = mongoose.model('Comment', CommentSchema);
