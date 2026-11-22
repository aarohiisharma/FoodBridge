const database = require('../config/database');

async function createNotification(userId, type, message, relatedType = null, relatedId = null) {
  const pickupRequestId = relatedType === 'PICKUP_REQUEST' ? relatedId : null;
  const relatedUserId = relatedType === 'USER' ? relatedId : null;
  const result = await database.query(
    `INSERT INTO notifications (user_id, type, message, pickup_request_id, related_user_id, is_read)
     VALUES ($1, $2, $3, $4, $5, FALSE)
     RETURNING id, user_id, type, message, pickup_request_id, related_user_id, is_read, created_at`,
    [userId, type, message, pickupRequestId, relatedUserId],
  );
  return result?.rows?.[0] || null;
}

async function listNotifications(userId) {
  const result = await database.query(
    `SELECT id, user_id, type, message, pickup_request_id, related_user_id, is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result?.rows || [];
}

async function markNotificationRead(notificationId, userId) {
  const result = await database.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, type, message, pickup_request_id, related_user_id, is_read, created_at`,
    [notificationId, userId],
  );
  return result?.rows?.[0] || null;
}

module.exports = { createNotification, listNotifications, markNotificationRead };
