const express = require('express');
const router = express.Router();
const Approval = require('../models/Approval');
const Activity = require('../models/Activity');
const requireAuth = require('../utils/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    const approvals = await Approval.find().sort({ requestedAt: -1 });
    res.json({ success: true, approvals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const count = await Approval.countDocuments();
    const id = `APR-${String(count + 1).padStart(3, '0')}`;
    
    const newApr = new Approval({
      id,
      ...req.body,
      status: 'Pending',
      requestedAt: new Date().toISOString().split('T')[0]
    });
    
    await newApr.save();
    res.json({ success: true, approval: newApr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/approve', requireAuth, async (req, res) => {
  try {
    const approval = await Approval.findOneAndUpdate(
      { id: req.params.id },
      { status: 'Approved', remarks: req.body.remarks || 'Approved' },
      { new: true }
    );
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found.' });

    const actCount = await Activity.countDocuments();
    await new Activity({
      id: `ACT-${String(actCount + 1).padStart(3, '0')}`,
      type: 'Approval',
      icon: '✅',
      text: `Approval ${approval.id} "${approval.title}" approved.`,
      timestamp: new Date().toISOString(),
      user: req.user.email || 'Admin'
    }).save();

    res.json({ success: true, approval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/reject', requireAuth, async (req, res) => {
  try {
    const approval = await Approval.findOneAndUpdate(
      { id: req.params.id },
      { status: 'Rejected', remarks: req.body.remarks || 'Rejected' },
      { new: true }
    );
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found.' });

    const actCount = await Activity.countDocuments();
    await new Activity({
      id: `ACT-${String(actCount + 1).padStart(3, '0')}`,
      type: 'Approval',
      icon: '❌',
      text: `Approval ${approval.id} "${approval.title}" rejected.`,
      timestamp: new Date().toISOString(),
      user: req.user.email || 'Admin'
    }).save();

    res.json({ success: true, approval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
