const mongoose = require('mongoose');

const rfqSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String },
  description: { type: String },
  items: [{
    name: String,
    qty: Number,
    unit: String
  }],
  deadline: { type: String },
  status: { type: String, default: 'Open' },
  assignedVendors: [String],
  createdBy: { type: String },
  createdAt: { type: String }
});

module.exports = mongoose.model('RFQ', rfqSchema);
