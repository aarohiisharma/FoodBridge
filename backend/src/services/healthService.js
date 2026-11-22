const database = require('../config/database');

async function getStatus() {
  await database.query('SELECT 1');
  return {
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getStatus };
