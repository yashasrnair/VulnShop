// seed.js — Populate VulnShop with demo data
const mongoose = require('mongoose');
const User = require('./models/index');
const { Product } = require('./models/index');
const { Order }   = require('./models/index');
const { Comment } = require('./models/index');

mongoose
  .connect(
    "your mongodb url",
  )
  .then(async () => {
    console.log("[*] Connected, seeding...");

    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Comment.deleteMany({});

    // Users with plaintext passwords (A02)
    const admin = await User.create({
      username: "admin",
      email: "admin@vulnshop.com",
      password: "admin123", // plaintext!
      isAdmin: true,
      role: "admin",
      profile: { address: "123 Admin St", phone: "555-0001" },
    });

    const alice = await User.create({
      username: "alice",
      email: "alice@example.com",
      password: "password", // plaintext!
      isAdmin: false,
      role: "user",
      profile: { address: "456 User Ave", creditCard: "4111-1111-1111-1111" }, // PII in DB!
    });

    const bob = await User.create({
      username: "bob",
      email: "bob@example.com",
      password: "123456",
      isAdmin: false,
      role: "user",
      profile: { address: "789 Oak Rd", ssn: "123-45-6789" }, // SSN stored!
    });

    console.log(
      "[*] Users created:",
      admin.username,
      alice.username,
      bob.username,
    );

    // Products
    const products = await Product.insertMany([
      {
        name: "Laptop Pro X",
        description: "High performance laptop. <b>Best seller!</b>",
        price: 999.99,
        category: "Electronics",
        stock: 50,
        imageUrl: "https://via.placeholder.com/300x200?text=Laptop",
        createdBy: admin._id,
      },
      {
        name: "Wireless Headphones",
        description: "Premium sound quality. <em>Limited stock!</em>",
        price: 199.99,
        category: "Electronics",
        stock: 100,
        imageUrl: "https://via.placeholder.com/300x200?text=Headphones",
        createdBy: admin._id,
      },
      {
        name: "Running Shoes",
        description: "Lightweight and comfortable.",
        price: 89.99,
        category: "Sports",
        stock: 200,
        imageUrl: "https://via.placeholder.com/300x200?text=Shoes",
        createdBy: admin._id,
      },
      {
        name: "Coffee Maker",
        description: "Brew the perfect cup every time.",
        price: 49.99,
        category: "Kitchen",
        stock: 75,
        imageUrl: "https://via.placeholder.com/300x200?text=Coffee",
        createdBy: admin._id,
      },
      {
        name: "Security Camera",
        description: "HD surveillance for your home.",
        price: 149.99,
        category: "Security",
        stock: 30,
        imageUrl: "https://via.placeholder.com/300x200?text=Camera",
        createdBy: admin._id,
      },
    ]);

    console.log("[*] Products created:", products.length);

    // Orders
    await Order.insertMany([
      {
        userId: alice._id,
        products: [{ productId: products[0]._id, quantity: 1, price: 999.99 }],
        total: 999.99,
        status: "delivered",
        address: alice.profile,
      },
      {
        userId: bob._id,
        products: [{ productId: products[1]._id, quantity: 2, price: 399.98 }],
        total: 399.98,
        status: "pending",
        address: bob.profile,
      },
    ]);

    console.log("[*] Orders created");

    // Comments with stored XSS payloads pre-seeded
    await Comment.insertMany([
      {
        productId: products[0]._id,
        userId: alice._id,
        username: "alice",
        content: "Great laptop! Really happy with the purchase.",
      },
      {
        productId: products[0]._id,
        userId: bob._id,
        username: "bob",
        content: "Good value for money.",
      },
    ]);

    console.log("[*] Comments created");
    console.log("\n✅ Seed complete!");
    console.log("\n📋 Test Credentials:");
    console.log("   Admin: admin@vulnshop.com / admin123");
    console.log("   User:  alice@example.com / password");
    console.log("   User:  bob@example.com / 123456");

    mongoose.disconnect();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
