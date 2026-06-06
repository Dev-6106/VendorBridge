const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Activity = require('../models/Activity');
const requireAuth = require('../utils/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ submittedAt: -1 });
    res.json({ success: true, quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const count = await Quotation.countDocuments();
    const id = `QT-${String(count + 1).padStart(3, '0')}`;
    
    const newQt = new Quotation({
      id,
      ...req.body,
      status: 'Submitted',
      submittedAt: new Date().toISOString().split('T')[0]
    });
    
    await newQt.save();

    const actCount = await Activity.countDocuments();
    await new Activity({
      id: `ACT-${String(actCount + 1).padStart(3, '0')}`,
      type: 'Quotation',
      icon: '💬',
      text: `Quotation ${newQt.id} submitted for ${newQt.rfqId}.`,
      timestamp: new Date().toISOString(),
      user: newQt.vendorName || 'Vendor'
    }).save();

    res.json({ success: true, quotation: newQt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
