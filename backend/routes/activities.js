const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const requireAuth = require('../utils/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    const activities = await Activity.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const count = await Activity.countDocuments();
    const id = `ACT-${String(count + 1).padStart(3, '0')}`;
    
    const newAct = new Activity({
      id,
      ...req.body,
      timestamp: new Date().toISOString()
    });
    
    await newAct.save();
    res.json({ success: true, activity: newAct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
