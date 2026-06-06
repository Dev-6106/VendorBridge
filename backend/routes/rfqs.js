const express = require('express');
const router = express.Router();
const RFQ = require('../models/RFQ');
const Activity = require('../models/Activity');
const requireAuth = require('../utils/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    const rfqs = await RFQ.find().sort({ createdAt: -1 });
    res.json({ success: true, rfqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const count = await RFQ.countDocuments();
    const id = `RFQ-${100 + count + 1}`;
    
    const newRfq = new RFQ({
      id,
      ...req.body,
      status: 'Open',
      createdAt: new Date().toISOString().split('T')[0]
    });
    
    await newRfq.save();

    const actCount = await Activity.countDocuments();
    await new Activity({
      id: `ACT-${String(actCount + 1).padStart(3, '0')}`,
      type: 'RFQ',
      icon: '📋',
      text: `RFQ ${newRfq.id} "${newRfq.title}" created.`,
      timestamp: new Date().toISOString(),
      user: req.user.email || 'System'
    }).save();

    res.json({ success: true, rfq: newRfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const rfq = await RFQ.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    );
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found.' });
    res.json({ success: true, rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
