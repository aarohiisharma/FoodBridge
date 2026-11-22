const database = require('../config/database');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

async function getAvailableTasks() {
  const result = await database.query(
    `SELECT *
     FROM pickup_requests
     WHERE status = 'APPROVED' AND volunteer_id IS NULL
    ORDER BY updated_at DESC, requested_at DESC`,
  );
  return result.rows;
}

async function getAssignedTasks(volunteerId) {
  const result = await database.query(
    `SELECT *
     FROM pickup_requests
     WHERE volunteer_id = $1
    ORDER BY updated_at DESC, requested_at DESC`,
    [volunteerId],
  );
  return result.rows;
}

async function acceptAssignment(pickupId, volunteerId) {
  const client = await database.pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT * FROM pickup_requests WHERE id = $1 FOR UPDATE',
      [pickupId],
    );
    if (!existing.rows[0]) {
      throw new AppError('Assignment not found', 404);
    }

    const task = existing.rows[0];
    if (task.volunteer_id) {
      throw new AppError('This assignment already has a volunteer', 409);
    }
    if (task.status !== 'APPROVED') {
      throw new AppError('Only approved assignments are available', 422);
    }

    const duplicate = await client.query(
      `SELECT id
       FROM pickup_requests
       WHERE donation_id = $1 AND volunteer_id = $2 AND id <> $3
       LIMIT 1`,
      [task.donation_id, volunteerId, pickupId],
    );
    if (duplicate.rows.length > 0) {
      throw new AppError('Duplicate volunteer assignment', 409);
    }

    const updated = await client.query(
      `UPDATE pickup_requests
       SET status = 'ASSIGNED', volunteer_id = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'APPROVED' AND volunteer_id IS NULL
       RETURNING *`,
      [volunteerId, pickupId],
    );
    if (!updated.rows[0]) {
      throw new AppError('This assignment was already accepted', 409);
    }

    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function declineAssignment(pickupId, volunteerId) {
  const result = await database.query(
    `UPDATE pickup_requests
     SET status = 'APPROVED', volunteer_id = NULL, updated_at = NOW()
     WHERE id = $1 AND status = 'ASSIGNED' AND volunteer_id = $2
     RETURNING *`,
    [pickupId, volunteerId],
  );
  if (!result.rows[0]) {
    throw new AppError('Only an assigned volunteer can decline this task', 409);
  }
  return result.rows[0];
}

async function updateVolunteerTask(pickupId, volunteerId, requestedStatus) {
  const existing = await database.query(
    'SELECT * FROM pickup_requests WHERE id = $1 LIMIT 1',
    [pickupId],
  );
  if (!existing.rows[0]) {
    throw new AppError('Assignment not found', 404);
  }

  const task = existing.rows[0];
  if (Number(task.volunteer_id) !== Number(volunteerId)) {
    throw new AppError('Only the assigned volunteer can update this task', 403);
  }

  if (
    (task.status === 'ASSIGNED' && requestedStatus === 'ACCEPTED')
    || (task.status === 'ACCEPTED' && requestedStatus === 'COLLECTED')
    || (task.status === 'COLLECTED' && requestedStatus === 'DELIVERED')
  ) {
    const updated = await database.query(
      `UPDATE pickup_requests
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [requestedStatus, pickupId],
    );

    if (requestedStatus === 'DELIVERED') {
      await database.query(
        `UPDATE donations
         SET status = 'COMPLETED'
         WHERE id = $1`,
        [task.donation_id],
      );
      await notificationService.createNotification(
        task.ngo_id,
        'DELIVERY_COMPLETED',
        'Your donated food delivery has been completed.',
        'PICKUP_REQUEST',
        pickupId,
      );
    }
    return updated.rows[0];
  }

  throw new AppError(
    `Status transition from ${task.status} to ${requestedStatus} is not allowed`,
    422,
  );
}

module.exports = {
  getAvailableTasks,
  getAssignedTasks,
  acceptAssignment,
  declineAssignment,
  updateVolunteerTask,
};
