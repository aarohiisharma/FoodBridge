const database = require('../config/database');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

const PENDING_STATUSES = new Set(['PENDING']);

function assertTransition(pickup, role, userId, requestedStatus, volunteerId) {
  const current = String(pickup.status).toUpperCase();
  const normalizedRole = String(role).toUpperCase();

  if (current === 'PENDING') {
    if (requestedStatus === 'APPROVED' || requestedStatus === 'REJECTED') {
      if (normalizedRole !== 'DONOR' || Number(pickup.donor_id) !== Number(userId)) {
        throw new AppError('Only the donation owner can approve or reject this request', 403);
      }
      return;
    }
    if (requestedStatus === 'CANCELLED') {
      if (normalizedRole !== 'NGO' || Number(pickup.ngo_id) !== Number(userId)) {
        throw new AppError('Only the requesting NGO can cancel this pickup', 403);
      }
      return;
    }
  }

  if (current === 'APPROVED' && requestedStatus === 'ASSIGNED') {
    if (normalizedRole !== 'DONOR' || Number(pickup.donor_id) !== Number(userId)) {
      throw new AppError('Only the donation owner can assign a volunteer', 403);
    }
    if (!volunteerId) {
      throw new AppError('Volunteer ID is required for assignment', 422);
    }
    return;
  }

  if (current === 'ASSIGNED' && requestedStatus === 'ACCEPTED') {
    if (
      normalizedRole !== 'VOLUNTEER'
      || !pickup.volunteer_id
      || Number(pickup.volunteer_id) !== Number(userId)
    ) {
      throw new AppError('Only the assigned volunteer can accept this task', 403);
    }
    return;
  }

  if (current === 'ACCEPTED' && requestedStatus === 'IN_TRANSIT') {
    if (
      normalizedRole !== 'VOLUNTEER'
      || Number(pickup.volunteer_id) !== Number(userId)
    ) {
      throw new AppError('Only the assigned volunteer can update this pickup', 403);
    }
    return;
  }

  if (current === 'IN_TRANSIT' && requestedStatus === 'COMPLETED') {
    const isAssignedVolunteer =
      normalizedRole === 'VOLUNTEER' && Number(pickup.volunteer_id) === Number(userId);
    const isOwner = normalizedRole === 'DONOR' && Number(pickup.donor_id) === Number(userId);
    const isNgo = normalizedRole === 'NGO' && Number(pickup.ngo_id) === Number(userId);

    if (!isAssignedVolunteer && !isOwner && !isNgo) {
      throw new AppError('This status can only be set by an authorized pickup participant', 403);
    }
    return;
  }

  throw new AppError(
    `Status transition from ${current} to ${requestedStatus} is not allowed`,
    422,
  );
}

async function createPickup(ngoId, { donation_id, notes }) {
  const ngoResult = await database.query(
    `SELECT u.id, u.role, np.verification_status
     FROM users u
     JOIN ngo_profiles np ON np.user_id = u.id
     WHERE u.id = $1 AND u.role = 'NGO'
     LIMIT 1`,
    [ngoId],
  );
  if (
    !ngoResult.rows[0]
    || String(ngoResult.rows[0].verification_status).toUpperCase() !== 'VERIFIED'
  ) {
    throw new AppError('Your NGO account must be verified before requesting pickups', 403);
  }

  const donationResult = await database.query(
    `SELECT id, donor_id, status, expiry_time
     FROM donations
     WHERE id = $1 AND status = 'AVAILABLE' AND expiry_time > NOW()
     LIMIT 1`,
    [donation_id],
  );

  if (!donationResult.rows[0]) {
    throw new AppError('Donation is unavailable or has expired', 404);
  }

  const duplicateResult = await database.query(
    `SELECT id
     FROM pickup_requests
     WHERE donation_id = $1 AND ngo_id = $2 AND status = 'PENDING'
     LIMIT 1`,
    [donation_id, ngoId],
  );

  if (duplicateResult.rows.length > 0) {
    throw new AppError('A pending pickup request already exists for this donation', 409);
  }

  const donation = donationResult.rows[0];
  const result = await database.query(
    `INSERT INTO pickup_requests
      (donation_id, ngo_id, volunteer_id, status, notes)
     VALUES ($1, $2, NULL, 'PENDING', $3)
     RETURNING id, donation_id, ngo_id, volunteer_id, status, notes, requested_at, updated_at`,
    [donation_id, ngoId, notes || null],
  );
  const pickup = { ...result.rows[0], donor_id: donation.donor_id };
  await notificationService.createNotification(
    donation.donor_id,
    'PICKUP_REQUEST',
    'A new NGO has requested pickup of your donation.',
    'PICKUP_REQUEST',
    pickup.id,
  );
  return pickup;
}

async function listPickups(user) {
  const role = String(user.role).toUpperCase();
  let query;
  let values = [user.id];

  if (role === 'NGO') {
    query = `SELECT p.*, d.donor_id
      FROM pickup_requests p
      JOIN donations d ON d.id = p.donation_id
      WHERE p.ngo_id = $1
      ORDER BY p.requested_at DESC`;
  } else if (role === 'DONOR') {
    query = `SELECT p.*, d.donor_id
      FROM pickup_requests p
      JOIN donations d ON d.id = p.donation_id
      WHERE d.donor_id = $1
      ORDER BY p.requested_at DESC`;
  } else if (role === 'VOLUNTEER') {
    query = `SELECT p.*, d.donor_id
      FROM pickup_requests p
      JOIN donations d ON d.id = p.donation_id
      WHERE p.volunteer_id = $1
      ORDER BY p.requested_at DESC`;
  } else if (role === 'ADMIN') {
    query = `SELECT p.*, d.donor_id
      FROM pickup_requests p
      JOIN donations d ON d.id = p.donation_id
      ORDER BY p.requested_at DESC`;
    values = [];
  } else {
    throw new AppError('Your role cannot view pickup requests', 403);
  }

  const result = values.length
    ? await database.query(query, values)
    : await database.query(query);
  return result.rows;
}

async function getPickupById(id) {
  const result = await database.query(
    `SELECT p.*, d.donor_id
     FROM pickup_requests p
     JOIN donations d ON d.id = p.donation_id
     WHERE p.id = $1
     LIMIT 1`,
    [id],
  );
  if (!result.rows[0]) {
    throw new AppError('Pickup request not found', 404);
  }
  return result.rows[0];
}

async function approvePickup(id, donorId) {
  const client = await database.pool.connect();

  try {
    await client.query('BEGIN');

    const pickupResult = await client.query(
      `SELECT p.*, d.donor_id
       FROM pickup_requests p
       JOIN donations d ON d.id = p.donation_id
       WHERE p.id = $1
       FOR UPDATE OF p`,
      [id],
    );
    if (!pickupResult.rows[0]) {
      throw new AppError('Pickup request not found', 404);
    }

    const pickup = pickupResult.rows[0];
    assertTransition(pickup, 'DONOR', donorId, 'APPROVED');

    const donationResult = await client.query(
      `SELECT id, status, expiry_time
       FROM donations
       WHERE id = $1 AND status = 'AVAILABLE' AND expiry_time > NOW()
       FOR UPDATE`,
      [pickup.donation_id],
    );
    if (!donationResult.rows[0]) {
      throw new AppError('Donation is no longer available', 409);
    }

    const acceptedResult = await client.query(
      `SELECT id
       FROM pickup_requests
       WHERE donation_id = $1 AND status = 'APPROVED'
       LIMIT 1`,
      [pickup.donation_id],
    );
    if (acceptedResult.rows.length > 0) {
      throw new AppError('This donation already has an approved pickup request', 409);
    }

    const updateResult = await client.query(
      `UPDATE pickup_requests
       SET status = 'APPROVED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    await client.query(
      `UPDATE donations
       SET status = 'CLAIMED'
       WHERE id = $1`,
      [pickup.donation_id],
    );

    await client.query('COMMIT');
    const approvedPickup = updateResult.rows[0];
    await notificationService.createNotification(
      approvedPickup.ngo_id,
      'PICKUP_APPROVED',
      'Your pickup request was approved.',
      'PICKUP_REQUEST',
      approvedPickup.id,
    );
    return approvedPickup;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updatePickupStatus(id, user, requestedStatus, volunteerId) {
  if (requestedStatus === 'APPROVED') {
    return approvePickup(id, user.id);
  }

  const pickup = await getPickupById(id);
  assertTransition(pickup, user.role, user.id, requestedStatus, volunteerId);

  let result;
  if (requestedStatus === 'ASSIGNED') {
    result = await database.query(
      `UPDATE pickup_requests
       SET status = 'ASSIGNED', volunteer_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [volunteerId, id],
    );
    const assignedPickup = result.rows[0];
    await notificationService.createNotification(
      volunteerId,
      'PICKUP_ASSIGNED',
      'A pickup task has been assigned to you.',
      'PICKUP_REQUEST',
      id,
    );
    return assignedPickup;
  } else {
    result = await database.query(
      `UPDATE pickup_requests
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [requestedStatus, id],
    );
  }

  if (requestedStatus === 'REJECTED') {
    await notificationService.createNotification(
      pickup.ngo_id,
      'PICKUP_REJECTED',
      'Your pickup request was rejected.',
      'PICKUP_REQUEST',
      id,
    );
  }

  return result.rows[0];
}

async function cancelPickup(id, ngoId) {
  const pickup = await getPickupById(id);
  assertTransition(pickup, 'NGO', ngoId, 'CANCELLED');
  const result = await database.query(
    `UPDATE pickup_requests
     SET status = 'CANCELLED', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id],
  );
  return result.rows[0];
}

module.exports = {
  PENDING_STATUSES,
  createPickup,
  listPickups,
  getPickupById,
  updatePickupStatus,
  cancelPickup,
};
