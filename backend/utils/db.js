const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const db = {
  read(entity) {
    const file = path.join(dataDir, `${entity}.json`);
    if (!fs.existsSync(file)) return [];
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (err) {
      console.error(`Error reading ${entity}:`, err);
      return [];
    }
  },
  write(entity, data) {
    const file = path.join(dataDir, `${entity}.json`);
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error writing ${entity}:`, err);
    }
  },
  nextId(entity) {
    const file = path.join(dataDir, 'nextId.json');
    if (!fs.existsSync(file)) return 1;
    try {
      const ids = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const id = ids[entity] || 1;
      ids[entity] = id + 1;
      fs.writeFileSync(file, JSON.stringify(ids, null, 2));
      return id;
    } catch (err) {
      console.error('Error with nextId:', err);
      return 1;
    }
  }
};

module.exports = db;
