const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Vendor = require('./models/Vendor');
const RFQ = require('./models/RFQ');
const Quotation = require('./models/Quotation');
const Approval = require('./models/Approval');
const PO = require('./models/PO');
const Activity = require('./models/Activity');
const User = require('./models/User');

const dataDir = path.join(__dirname, 'data');

const seedDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/vendorbridge');
    console.log('✅ Connected to MongoDB');

    // Clear existing collections
    await Vendor.deleteMany({});
    await RFQ.deleteMany({});
    await Quotation.deleteMany({});
    await Approval.deleteMany({});
    await PO.deleteMany({});
    await Activity.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Read and insert JSON data
    const loadJSON = (filename) => {
      const filePath = path.join(dataDir, filename);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
      return [];
    };

    const vendors = loadJSON('vendors.json');
    if (vendors.length) await Vendor.insertMany(vendors);

    const rfqs = loadJSON('rfqs.json');
    if (rfqs.length) await RFQ.insertMany(rfqs);

    const quotations = loadJSON('quotations.json');
    if (quotations.length) await Quotation.insertMany(quotations);

    const approvals = loadJSON('approvals.json');
    if (approvals.length) await Approval.insertMany(approvals);

    const pos = loadJSON('pos.json');
    if (pos.length) await PO.insertMany(pos);

    const activities = loadJSON('activities.json');
    if (activities.length) await Activity.insertMany(activities);

    const users = loadJSON('users.json');
    if (users.length) await User.insertMany(users);

    console.log('🌱 Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
