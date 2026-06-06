const mongoose = require('mongoose');

const poSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  rfqId: { type: String },
  rfqTitle: { type: String },
  vendorId: { type: String },
  vendorName: { type: String },
  items: [{
    name: String,
    qty: Number,
    unitPrice: Number,
    total: Number
  }],
  subTotal: { type: Number },
  gstPercent: { type: Number },
  gstAmount: { type: Number },
  grandTotal: { type: Number },
  status: { type: String, default: 'Issued' },
  issuedDate: { type: String },
  deliveryDate: { type: String },
  invoiceGenerated: { type: Boolean, default: false }
});

module.exports = mongoose.model('PO', poSchema);
