const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String },
  gst: { type: String },
  email: { type: String },
  phone: { type: String },
  status: { type: String, default: 'Active' },
  rating: { type: Number, default: 0 },
  addedDate: { type: String }
});

module.exports = mongoose.model('Vendor', vendorSchema);
