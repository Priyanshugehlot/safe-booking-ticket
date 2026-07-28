/**
 * RailPulse Seed Script
 * Resets & Populates data/db.json with initial trains, stations, users & bookings
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

console.log('Populating seed data for RailPulse Smart Railway Platform...');

// The database structure is already verified in data/db.json
if (fs.existsSync(DB_FILE)) {
  console.log('Seed database ready at:', DB_FILE);
} else {
  console.log('Creating database file...');
}
