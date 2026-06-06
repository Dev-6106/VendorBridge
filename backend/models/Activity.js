const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String },
  icon: { type: String },
  text: { type: String },
  timestamp: { type: String },
  user: { type: String }
});

module.exports = mongoose.model('Activity', activitySchema);
