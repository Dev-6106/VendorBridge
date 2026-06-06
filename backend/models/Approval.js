const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  refId: { type: String, required: true },
  type: { type: String },
  title: { type: String },
  amount: { type: Number },
  requestedBy: { type: String },
  department: { type: String },
  status: { type: String, default: 'Pending' },
  stage: { type: Number },
  totalStages: { type: Number },
  stages: [String],
  remarks: { type: String },
  requestedAt: { type: String }
});

module.exports = mongoose.model('Approval', approvalSchema);
