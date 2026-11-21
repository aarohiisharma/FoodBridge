const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/database');

const server = app.listen(env.port, () => {
  console.log(`FoodBridge API listening on port ${env.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down gracefully`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });

  setTimeout(() => {
    void pool.end();
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
