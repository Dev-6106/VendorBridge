/**
 * ERP Pro — Express Backend Server
 * Procurement & Vendor Management API
 * Odoo × KSV Hackathon
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
<<<<<<< HEAD
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vendorbridge')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));
=======
>>>>>>> 56954eb0e3c6f3c3c828cf0cb33267abbccc42de

const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors({
<<<<<<< HEAD
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5173', 'http://127.0.0.1:5173'],
=======
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'null', '*'],
>>>>>>> 56954eb0e3c6f3c3c828cf0cb33267abbccc42de
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
<<<<<<< HEAD
const vendorRoutes     = require('./routes/vendors');
const rfqRoutes        = require('./routes/rfqs');
const quotationRoutes  = require('./routes/quotations');
const approvalRoutes   = require('./routes/approvals');
const poRoutes         = require('./routes/pos');
const activityRoutes   = require('./routes/activities');

app.use('/api', authRoutes); // login, me, logout, users
app.use('/api/vendors', vendorRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/pos', poRoutes);
app.use('/api/activities', activityRoutes);
=======
app.use('/api', authRoutes);
>>>>>>> 56954eb0e3c6f3c3c828cf0cb33267abbccc42de

/* ── Health check ── */
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    message: 'ERP Pro API is running 🚀',
    version: '1.0.0',
    endpoints: {
<<<<<<< HEAD
      login:      'POST /api/login',
      me:         'GET  /api/me',
      vendors:    'GET  /api/vendors',
      rfqs:       'GET  /api/rfqs',
      quotations: 'GET  /api/quotations',
      approvals:  'GET  /api/approvals',
      pos:        'GET  /api/pos',
      activities: 'GET  /api/activities'
=======
      login:  'POST /api/login',
      me:     'GET  /api/me',
      logout: 'POST /api/logout',
      users:  'GET  /api/users  (admin only)',
>>>>>>> 56954eb0e3c6f3c3c828cf0cb33267abbccc42de
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
<<<<<<< HEAD
=======
  console.log(`   Login API:    POST http://localhost:${PORT}/api/login\n`);
>>>>>>> 56954eb0e3c6f3c3c828cf0cb33267abbccc42de
});
