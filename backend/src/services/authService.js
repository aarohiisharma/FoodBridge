const bcrypt = require('bcrypt');
const database = require('../config/database');
const { signToken } = require('../config/jwt');
const AppError = require('../utils/AppError');

const ALLOWED_ROLES = new Set(['DONOR', 'NGO', 'VOLUNTEER']);

function toPublicUser(row) {
  if (!row) return null;

  const {
    password_hash,
    password,
    ngo_password,
    ...user
  } = row;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: String(user.role || '').toUpperCase(),
    phone: user.phone || null,
    address: user.address || null,
    created_at: user.created_at,
  };
}

async function register({ name, email, password, role, ngoOrganizationName, ngoRegistrationNumber }) {
  const normalizedRole = String(role).toUpperCase();
  if (!ALLOWED_ROLES.has(normalizedRole)) {
    throw new AppError('Invalid role', 422);
  }

  const existing = await database.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email],
  );
  if (existing.rows.length > 0) {
    throw new AppError('Email is already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = normalizedRole === 'NGO' ? await database.pool.connect() : null;
  const query = client ? client.query.bind(client) : database.query;

  try {
    if (client) await client.query('BEGIN');
    const created = await query(
      `INSERT INTO users
        (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, phone, address, created_at`,
      [
        name,
        email,
        passwordHash,
        normalizedRole,
      ],
    );

    if (normalizedRole === 'NGO') {
      await query(
        `INSERT INTO ngo_profiles (user_id, organization_name, registration_number)
         VALUES ($1, $2, $3)`,
        [created.rows[0].id, ngoOrganizationName, ngoRegistrationNumber],
      );
    }

    if (client) await client.query('COMMIT');

    const user = toPublicUser(created.rows[0]);
    return {
      user,
      token: signToken({ id: user.id, email: user.email, role: user.role }),
    };
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    if (error.code === '23505') {
      throw new AppError('Email is already registered', 409);
    }
    throw error;
  } finally {
    if (client) client.release();
  }
}

async function login(email, password) {
  const result = await database.query(
    `SELECT id, name, email, password_hash, role, phone, address, created_at
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  const row = result.rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = toPublicUser(row);
  return {
    user,
    token: signToken({ id: user.id, email: user.email, role: user.role }),
  };
}

async function getProfile(userId) {
  const result = await database.query(
    `SELECT id, name, email, role, phone, address, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  if (!result.rows[0]) {
    throw new AppError('User not found', 404);
  }

  return toPublicUser(result.rows[0]);
}

async function updateProfile(userId, updates) {
  const fields = [];
  const values = [];

  for (const field of ['name', 'phone', 'address']) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      values.push(updates[field]);
      fields.push(`${field} = $${values.length}`);
    }
  }

  if (fields.length === 0) {
    return getProfile(userId);
  }

  values.push(userId);
  const result = await database.query(
    `UPDATE users
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id, name, email, role, phone, address, created_at`,
    values,
  );

  if (!result.rows[0]) {
    throw new AppError('User not found', 404);
  }

  return toPublicUser(result.rows[0]);
}

module.exports = { register, login, getProfile, updateProfile, toPublicUser };
