/**
 * ERP Pro — Express Backend Server
 * Procurement & Vendor Management API
 * Odoo × KSV Hackathon
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'null', '*'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Request logger ── */
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* ── API Routes ── */
app.use('/api', authRoutes);

/* ── Health check ── */
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    message: 'ERP Pro API is running 🚀',
    version: '1.0.0',
    endpoints: {
      login:  'POST /api/login',
      me:     'GET  /api/me',
      logout: 'POST /api/logout',
      users:  'GET  /api/users  (admin only)',
    },
  });
});

/* ── 404 handler ── */
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

/* ── Error handler ── */
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ── Start ── */
app.listen(PORT, () => {
  console.log(`\n✅ ERP Pro Backend running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/`);
  console.log(`   Login API:    POST http://localhost:${PORT}/api/login\n`);
});
