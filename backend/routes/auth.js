/**
 * routes/auth.js — Authentication Routes
 * POST /api/login
 * GET  /api/me
 * POST /api/logout
 * GET  /api/users  (admin only)
 */

const express = require('express');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const fs      = require('fs');

const router = express.Router();

/* ── Config ── */
const JWT_SECRET  = process.env.JWT_SECRET || 'erp_pro_hackathon_secret_2025';
const JWT_EXPIRES = '8h';

/* ── Load users from JSON ── */
function getUsers() {
  const usersPath = path.join(__dirname, '..', 'data', 'users.json');
  return JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
}

/* ── Auth middleware (inline for simplicity) ── */
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

/* ────────────────────────────────────────────
   POST /api/login
   Body: { email, password }
   ──────────────────────────────────────────── */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const users = getUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== password) {
    /* Note: In production, use bcrypt.compare for hashed passwords */
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  /* Sign JWT */
  const payload = { id: user.id, email: user.email, role: user.role };
  const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  /* Return user without password */
  const { password: _pw, ...safeUser } = user;

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: safeUser,
  });
});

/* ────────────────────────────────────────────
   GET /api/me — Get current user info
   Requires: Authorization: Bearer <token>
   ──────────────────────────────────────────── */
router.get('/me', requireAuth, (req, res) => {
  const users = getUsers();
  const user  = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { password: _pw, ...safeUser } = user;
  return res.status(200).json({ success: true, user: safeUser });
});

/* ────────────────────────────────────────────
   POST /api/logout — Invalidate session
   (Client-side: just delete the token)
   ──────────────────────────────────────────── */
router.post('/logout', requireAuth, (req, res) => {
  /* Stateless JWT: actual invalidation is done client-side */
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

/* ────────────────────────────────────────────
   GET /api/users — List all users (admin only)
   ──────────────────────────────────────────── */
router.get('/users', requireAuth, (req, res) => {
  if (req.user.role !== 'Administrator') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }

  const users = getUsers().map(({ password: _pw, ...u }) => u);
  return res.status(200).json({ success: true, users });
});

module.exports = router;
