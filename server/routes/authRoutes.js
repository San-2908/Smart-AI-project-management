const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/Schemas');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, username, password: hashedPassword });
    res.json({ success: true, message: "User registered" });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, error: `${field} already exists` });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const mongoose = require('mongoose');
  
  // Emergency Login if DB is disconnected
  if (mongoose.connection.readyState !== 1) {
    if (username === 'admin') {
      const token = jwt.sign({ id: 'offline-admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ success: true, token, username: 'admin (offline mode)' });
    }
    return res.status(503).json({ success: false, error: "Database offline. Login as 'admin' for offline mode." });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, username: user.username });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
