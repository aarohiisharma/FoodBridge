const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is required for integration tests; configure a dedicated database ending in _test.',
  );
}

let testDatabaseName;
try {
  testDatabaseName = decodeURIComponent(new URL(TEST_DATABASE_URL).pathname.replace(/^\/+/, ''));
} catch (error) {
  throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL connection URL.', { cause: error });
}

if (!testDatabaseName.endsWith('_test')) {
  throw new Error('Integration tests refuse to run unless the database name ends in _test.');
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = 'foodbridge-integration-test-only-secret';

for (const variable of [
  'PGHOST',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'PGSSL',
  'PGSSL_REJECT_UNAUTHORIZED',
]) {
  delete process.env[variable];
}

const request = require('supertest');
const app = require('../../app');
const database = require('../../config/database');

const TEST_ACCOUNTS = [
  { role: 'DONOR', index: 1 },
  { role: 'NGO', index: 1 },
  { role: 'NGO', index: 2 },
  { role: 'VOLUNTEER', index: 1 },
];

function account(role, index = 1) {
  const suffix = role.toLowerCase();
  const value = {
    name: `Integration ${suffix} ${index}`,
    email: `foodbridge-it-${suffix}-${index}@example.test`,
    password: 'Integration-Test-Password-2026!',
    role,
  };

  if (role === 'NGO') {
    value.ngoOrganizationName = `Integration Test NGO ${index}`;
    value.ngoRegistrationNumber = `IT-NGO-${index}`;
  }

  return value;
}

async function registerAccount(user) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      ...(user.role === 'NGO'
        ? {
          ngoOrganizationName: user.ngoOrganizationName,
          ngoRegistrationNumber: user.ngoRegistrationNumber,
        }
        : {}),
    });

  if (user.role === 'NGO' && response.status === 201) {
    await database.query(
      `UPDATE ngo_profiles
       SET verification_status = 'VERIFIED', updated_at = NOW()
       WHERE user_id = $1`,
      [response.body.user.id],
    );
  }

  return response;
}

async function loginAccount(user) {
  return request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });
}

async function registerAndLogin(user) {
  const registration = await registerAccount(user);
  expect(registration.status).toBe(201);
  const login = await loginAccount(user);
  expect(login.status).toBe(200);
  return { user: registration.body.user, token: login.body.token };
}

function donationPayload(suffix = 'meal') {
  return {
    food_name: `Integration ${suffix}`,
    food_type: 'COOKED',
    quantity: 4,
    quantity_unit: 'portions',
    preparation_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    expiry_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    description: `Integration test fixture ${suffix}`,
    pickup_location: 'Integration test fixture location',
  };
}

async function cleanupTestData() {
  const emails = TEST_ACCOUNTS.map(({ role, index }) => account(role, index).email);
  const users = await database.query(
    'SELECT id FROM users WHERE email = ANY($1::text[])',
    [emails],
  );
  const userIds = users.rows.map((row) => row.id);
  if (userIds.length === 0) return;

  const donations = await database.query(
    'SELECT id FROM donations WHERE donor_id = ANY($1::bigint[])',
    [userIds],
  );
  const donationIds = donations.rows.map((row) => row.id);

  await database.query(
    `DELETE FROM pickup_requests
     WHERE donation_id = ANY($1::bigint[])
        OR ngo_id = ANY($2::bigint[])
        OR volunteer_id = ANY($2::bigint[])`,
    [donationIds, userIds],
  );
  await database.query(
    'DELETE FROM donations WHERE donor_id = ANY($1::bigint[])',
    [userIds],
  );
  await database.query(
    'DELETE FROM ngo_profiles WHERE user_id = ANY($1::bigint[])',
    [userIds],
  );
  await database.query(
    'DELETE FROM users WHERE id = ANY($1::bigint[])',
    [userIds],
  );
}

function registerIntegrationHooks() {
  let databaseReady = false;

  beforeAll(async () => {
    const result = await database.query('SELECT current_database() AS name');
    if (result.rows[0].name !== testDatabaseName) {
      throw new Error('Connected database name does not match TEST_DATABASE_URL.');
    }
    await cleanupTestData();
    databaseReady = true;
  });

  afterEach(async () => {
    if (databaseReady) await cleanupTestData();
  });

  afterAll(async () => {
    try {
      if (databaseReady) await cleanupTestData();
    } finally {
      await database.pool.end();
    }
  });
}

module.exports = {
  account,
  database,
  donationPayload,
  loginAccount,
  registerAccount,
  registerAndLogin,
  registerIntegrationHooks,
  request,
  app,
};
