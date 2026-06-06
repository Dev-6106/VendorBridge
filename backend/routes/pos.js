const express = require('express');
const router = express.Router();
const PO = require('../models/PO');
const Activity = require('../models/Activity');
const requireAuth = require('../utils/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    const pos = await PO.find().sort({ issuedDate: -1 });
    res.json({ success: true, pos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const count = await PO.countDocuments();
    const id = `PO-${2000 + count + 1}`;
    
    const newPo = new PO({
      id,
      ...req.body,
      status: 'Issued',
      issuedDate: new Date().toISOString().split('T')[0],
      invoiceGenerated: false
    });
    
    await newPo.save();

    const actCount = await Activity.countDocuments();
    await new Activity({
      id: `ACT-${String(actCount + 1).padStart(3, '0')}`,
      type: 'PO',
      icon: '🛒',
      text: `Purchase Order ${newPo.id} issued to ${newPo.vendorName}.`,
      timestamp: new Date().toISOString(),
      user: req.user.email || 'System'
    }).save();

    res.json({ success: true, po: newPo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/invoice', requireAuth, async (req, res) => {
  try {
    const po = await PO.findOneAndUpdate(
      { id: req.params.id },
      { invoiceGenerated: true, status: 'Invoice Sent' },
      { new: true }
    );
    if (!po) return res.status(404).json({ success: false, message: 'PO not found.' });
    res.json({ success: true, po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
