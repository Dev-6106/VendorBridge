const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Vendor = require('../models/Vendor');
const Activity = require('../models/Activity');
const requireAuth = require('../utils/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: new RegExp('^' + req.user.email + '$', 'i') });
      if (!vendor) return res.json({ success: true, quotations: [] });
      query.vendorId = vendor.id;
    }
    const quotations = await Quotation.find(query).sort({ submittedAt: -1 });
    res.json({ success: true, quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const count = await Quotation.countDocuments();
    const id = `QT-${String(count + 1).padStart(3, '0')}`;
    
    let vendorId = req.body.vendorId;
    let vendorName = req.body.vendorName;
    
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: new RegExp('^' + req.user.email + '$', 'i') });
      if (vendor) {
        vendorId = vendor.id;
        vendorName = vendor.name;
      }
    }
    
    const status = req.body.status || 'Submitted';
    
    const newQt = new Quotation({
      id,
      rfqId: req.body.rfqId,
      vendorId,
      vendorName,
      items: req.body.items || [],
      deliveryDays: req.body.deliveryDays,
      gstPercent: req.body.gstPercent || 18,
      gstAmount: req.body.gstAmount || 0,
      subTotal: req.body.subTotal || 0,
      grandTotal: req.body.grandTotal || 0,
      notes: req.body.notes,
      status,
      submittedAt: new Date().toISOString().split('T')[0]
    });
    
    await newQt.save();

    if (status === 'Submitted') {
      const actCount = await Activity.countDocuments();
      await new Activity({
        id: `ACT-${String(actCount + 1).padStart(3, '0')}`,
        type: 'Quotation',
        icon: '💬',
        text: `Quotation ${newQt.id} submitted for RFQ ${newQt.rfqId}.`,
        timestamp: new Date().toISOString(),
        user: newQt.vendorName || 'Vendor'
      }).save();
    }

    res.json({ success: true, quotation: newQt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    let query = { id: req.params.id };
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: new RegExp('^' + req.user.email + '$', 'i') });
      if (!vendor) return res.status(403).json({ success: false, message: 'Vendor profile not found.' });
      query.vendorId = vendor.id;
    }
    
    const oldQuote = await Quotation.findOne(query);
    if (!oldQuote) return res.status(404).json({ success: false, message: 'Quotation not found or unauthorized.' });
    
    const status = req.body.status || oldQuote.status;
    const updatedData = {
      items: req.body.items || oldQuote.items,
      deliveryDays: req.body.deliveryDays !== undefined ? req.body.deliveryDays : oldQuote.deliveryDays,
      gstPercent: req.body.gstPercent !== undefined ? req.body.gstPercent : oldQuote.gstPercent,
      gstAmount: req.body.gstAmount !== undefined ? req.body.gstAmount : oldQuote.gstAmount,
      subTotal: req.body.subTotal !== undefined ? req.body.subTotal : oldQuote.subTotal,
      grandTotal: req.body.grandTotal !== undefined ? req.body.grandTotal : oldQuote.grandTotal,
      notes: req.body.notes !== undefined ? req.body.notes : oldQuote.notes,
      status
    };
    
    const quotation = await Quotation.findOneAndUpdate(
      query,
      { $set: updatedData },
      { new: true }
    );
    
    if (oldQuote.status === 'Draft' && quotation.status === 'Submitted') {
      const actCount = await Activity.countDocuments();
      await new Activity({
        id: `ACT-${String(actCount + 1).padStart(3, '0')}`,
        type: 'Quotation',
        icon: '💬',
        text: `Quotation ${quotation.id} submitted for RFQ ${quotation.rfqId}.`,
        timestamp: new Date().toISOString(),
        user: quotation.vendorName || 'Vendor'
      }).save();
    }
    
    res.json({ success: true, quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
