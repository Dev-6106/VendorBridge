const express = require('express');
const router = express.Router();
const Approval = require('../models/Approval');
const Activity = require('../models/Activity');
const PO = require('../models/PO');
const Quotation = require('../models/Quotation');
const RFQ = require('../models/RFQ');
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

    // Auto-generate Purchase Order if type is Quotation
    if (approval.type === 'Quotation' || approval.type === 'Quotations') {
      const quotation = await Quotation.findOne({ id: approval.refId });
      if (quotation) {
        const poCount = await PO.countDocuments();
        const poId = `PO-${2000 + poCount + 1}`;
        
        const newPo = new PO({
          id: poId,
          rfqId: quotation.rfqId,
          rfqTitle: approval.title,
          vendorId: quotation.vendorId,
          vendorName: quotation.vendorName,
          items: quotation.items,
          subTotal: quotation.subTotal,
          gstPercent: quotation.gstPercent,
          gstAmount: quotation.gstAmount,
          grandTotal: quotation.grandTotal,
          status: 'Issued',
          issuedDate: new Date().toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + (quotation.deliveryDays || 30) * 24 * 3600 * 1000).toISOString().split('T')[0],
          invoiceGenerated: false
        });
        await newPo.save();

        // Mark this quotation as Accepted
        quotation.status = 'Accepted';
        await quotation.save();

        // Mark other quotations for the same RFQ as Rejected
        await Quotation.updateMany(
          { rfqId: quotation.rfqId, id: { $ne: quotation.id } },
          { status: 'Rejected' }
        );

        // Mark RFQ as Closed
        await RFQ.findOneAndUpdate({ id: quotation.rfqId }, { status: 'Closed' });

        // Log PO Activity
        await new Activity({
          id: `ACT-${String(actCount + 2).padStart(3, '0')}`,
          type: 'PO',
          icon: '🛒',
          text: `Purchase Order ${poId} auto-generated for ${quotation.vendorName}.`,
          timestamp: new Date().toISOString(),
          user: 'System'
        }).save();
      }
    }

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
