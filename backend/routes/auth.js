const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'erp_pro_hackathon_secret_2025';
const JWT_EXPIRES = '8h';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const count = await User.countDocuments();
    const newUser = new User({
      id: `USR-${String(count + 1).padStart(3, '0')}`,
      name,
      email,
      role: role || 'Procurement Officer',
      password // In production, hash this with bcrypt
    });

    await newUser.save();
    res.json({ success: true, message: 'Account created successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/users', requireAuth, async (req, res) => {
  if (req.user.role !== 'Administrator') return res.status(403).json({ success: false, message: 'Access denied.' });
  try {
    const users = await User.find({}, '-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const resetCodes = {};

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes[email.toLowerCase()] = code;
    
    res.json({ success: true, message: 'Verification code sent to email (simulated).', code });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code, and new password are required.' });
    }
    
    const savedCode = resetCodes[email.toLowerCase()];
    if (!savedCode || savedCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }
    
    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    user.password = newPassword;
    await user.save();
    
    delete resetCodes[email.toLowerCase()];
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
