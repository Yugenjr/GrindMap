// GitHub Scraper Activity Log
// This file logs all activity, errors, retries, and edge cases encountered during scraping.

const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, 'github.scraper.activity.log');

function logActivity(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_PATH, `[${timestamp}] ${message}\n`);
}

module.exports = { logActivity };
