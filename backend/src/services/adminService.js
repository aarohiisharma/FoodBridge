const database = require('../config/database');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

async function getStats() {
  const [users, donations, pickups] = await Promise.all([
    database.query('SELECT COUNT(*)::int AS users FROM users'),
    database.query('SELECT COUNT(*)::int AS donations FROM donations'),
    database.query('SELECT COUNT(*)::int AS pickups FROM pickup_requests'),
  ]);

  return {
    users: Number(users.rows[0].users),
    donations: Number(donations.rows[0].donations),
    pickups: Number(pickups.rows[0].pickups),
  };
}

async function getRegisteredUsers() {
  const result = await database.query(
    `SELECT u.id, u.name, u.email, u.role, u.phone,
       np.verification_status, u.created_at
     FROM users u
     LEFT JOIN ngo_profiles np ON np.user_id = u.id
     ORDER BY u.created_at DESC`,
  );
  return result.rows;
}

async function getNgos() {
  const result = await database.query(
    `SELECT u.id, u.name, u.email, u.role, np.organization_name,
       np.registration_number, np.verification_status, u.phone, u.created_at
     FROM users u
     JOIN ngo_profiles np ON np.user_id = u.id
     WHERE u.role = 'NGO'
     ORDER BY u.created_at DESC`,
  );
  return result.rows;
}

async function getDonations() {
  const result = await database.query(
    `SELECT id, donor_id, food_name, food_type, quantity, quantity_unit,
       preparation_time, expiry_time, description, pickup_location, image_url,
       status, created_at
     FROM donations
     ORDER BY created_at DESC`,
  );
  return result.rows;
}

async function updateNgoVerification(ngoId, status) {
  const normalized = String(status).toUpperCase();
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(normalized)) {
    throw new AppError('Verification status must be APPROVED, REJECTED, or PENDING', 422);
  }

  const verificationStatus = normalized === 'APPROVED'
    ? 'VERIFIED'
    : normalized === 'REJECTED'
      ? 'REJECTED'
      : 'PENDING';

  const result = await database.query(
    `UPDATE ngo_profiles
     SET verification_status = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING user_id AS id, organization_name, registration_number,
       verification_status, updated_at`,
    [verificationStatus, ngoId],
  );
  if (!result.rows[0]) {
    throw new AppError('NGO not found', 404);
  }

  await notificationService.createNotification(
    ngoId,
    'NGO_VERIFICATION',
    verificationStatus === 'VERIFIED'
      ? 'Your NGO verification has been approved.'
      : 'Your NGO verification request was rejected.',
    'USER',
    ngoId,
  );
  return result.rows[0];
}

module.exports = {
  getStats,
  getRegisteredUsers,
  getNgos,
  getDonations,
  updateNgoVerification,
};
