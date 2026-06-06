const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  rfqId: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String },
  items: [{
    name: String,
    qty: Number,
    unitPrice: Number,
    total: Number
  }],
  deliveryDays: { type: Number },
  gstPercent: { type: Number },
  gstAmount: { type: Number },
  subTotal: { type: Number },
  grandTotal: { type: Number },
  notes: { type: String },
  status: { type: String, default: 'Submitted' },
  submittedAt: { type: String }
});

module.exports = mongoose.model('Quotation', quotationSchema);
