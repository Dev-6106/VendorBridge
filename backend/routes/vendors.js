const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const requireAuth = require('../utils/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ addedDate: -1 });
    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const count = await Vendor.countDocuments();
    const id = `V${String(count + 1).padStart(3, '0')}`;
    
    const newVendor = new Vendor({
      id,
      ...req.body,
      addedDate: new Date().toISOString().split('T')[0]
    });
    
    await newVendor.save();
    res.json({ success: true, vendor: newVendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found.' });
    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndDelete({ id: req.params.id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found.' });
    res.json({ success: true, message: 'Vendor deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
