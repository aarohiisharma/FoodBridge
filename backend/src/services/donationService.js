const database = require('../config/database');
const AppError = require('../utils/AppError');

async function createDonation(donorId, data) {
  const result = await database.query(
    `INSERT INTO donations
      (donor_id, food_name, food_type, quantity, quantity_unit,
       preparation_time, expiry_time, description, pickup_location, image_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'AVAILABLE')
     RETURNING id, donor_id, food_name, food_type, quantity, quantity_unit,
       preparation_time, expiry_time, description, pickup_location, image_url, status, created_at`,
    [
      donorId,
      data.food_name,
      data.food_type,
      data.quantity,
      data.quantity_unit,
      data.preparation_time,
      data.expiry_time,
      data.description || null,
      data.pickup_location,
      data.image_url || null,
    ],
  );

  return result.rows[0];
}

async function listAvailableDonations(filters = {}) {
  const where = ["status = 'AVAILABLE'", 'expiry_time > NOW()'];
  const values = [];

  function addCondition(condition, value) {
    values.push(value);
    where.push(condition.replace('?', `$${values.length}`));
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const searchIndex = values.length;
    where.push(
      `(food_name ILIKE $${searchIndex} OR description ILIKE $${searchIndex} OR pickup_location ILIKE $${searchIndex})`,
    );
  }
  if (filters.food_type) addCondition('UPPER(food_type) = UPPER(?)', filters.food_type);
  if (filters.quantity_min !== undefined) addCondition('quantity >= ?', filters.quantity_min);
  if (filters.quantity_max !== undefined) addCondition('quantity <= ?', filters.quantity_max);
  if (filters.quantity_unit) addCondition('LOWER(quantity_unit) = LOWER(?)', filters.quantity_unit);
  if (filters.location) addCondition('pickup_location ILIKE ?', `%${filters.location}%`);
  if (filters.expiry_before) addCondition('expiry_time <= ?', filters.expiry_before);
  if (filters.expiry_after) addCondition('expiry_time >= ?', filters.expiry_after);

  const result = await database.query(
    `SELECT id, donor_id, food_name, food_type, quantity, quantity_unit,
       preparation_time, expiry_time, description, pickup_location, image_url, status, created_at
     FROM donations
     WHERE ${where.join(' AND ')}
     ORDER BY expiry_time ASC, created_at DESC`,
    values,
  );

  return result.rows;
}

async function getAvailableDonationById(id) {
  const result = await database.query(
    `SELECT id, donor_id, food_name, food_type, quantity, quantity_unit,
       preparation_time, expiry_time, description, pickup_location, image_url, status, created_at
     FROM donations
     WHERE id = $1 AND status = 'AVAILABLE' AND expiry_time > NOW()
     LIMIT 1`,
    [id],
  );

  if (!result.rows[0]) {
    throw new AppError('Available donation not found', 404);
  }

  return result.rows[0];
}

async function getMyDonations(donorId) {
  const result = await database.query(
    `SELECT id, donor_id, food_name, food_type, quantity, quantity_unit,
       preparation_time, expiry_time, description, pickup_location, image_url, status, created_at
     FROM donations
     WHERE donor_id = $1
     ORDER BY created_at DESC`,
    [donorId],
  );
  return result.rows;
}

async function getDonationForOwner(id, donorId) {
  const result = await database.query(
    `SELECT id, donor_id, food_name, food_type, quantity, quantity_unit,
       preparation_time, expiry_time, description, pickup_location, image_url, status, created_at
     FROM donations
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  if (!result.rows[0]) {
    throw new AppError('Donation not found', 404);
  }
  if (Number(result.rows[0].donor_id) !== Number(donorId)) {
    throw new AppError('You can only modify your own donations', 403);
  }

  return result.rows[0];
}

async function updateDonation(id, donorId, updates) {
  const existing = await getDonationForOwner(id, donorId);

  const editableFields = [
    'food_name',
    'food_type',
    'quantity',
    'quantity_unit',
    'preparation_time',
    'expiry_time',
    'description',
    'pickup_location',
    'image_url',
    'status',
  ];
  const assignments = [];
  const values = [];

  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      values.push(updates[field]);
      assignments.push(`${field} = $${values.length}`);
    }

    const preparationTime = updates.preparation_time || existing.preparation_time;
    const expiryTime = updates.expiry_time || existing.expiry_time;
    if (new Date(expiryTime) <= new Date(preparationTime)) {
      throw new AppError('Expiry time must be later than preparation time', 422);
    }
  }

  if (assignments.length === 0) {
    const existing = await getAvailableDonationById(id);
    return existing;
  }

  values.push(id);
  const result = await database.query(
    `UPDATE donations
     SET ${assignments.join(', ')}
     WHERE id = $${values.length}
     RETURNING id, donor_id, food_name, food_type, quantity, quantity_unit,
       preparation_time, expiry_time, description, pickup_location, image_url, status, created_at`,
    values,
  );

  return result.rows[0];
}

async function deleteDonation(id, donorId) {
  await getDonationForOwner(id, donorId);
  const result = await database.query(
    `DELETE FROM donations
     WHERE id = $1
     RETURNING id`,
    [id],
  );
  return result.rows[0];
}

module.exports = {
  createDonation,
  listAvailableDonations,
  getAvailableDonationById,
  getMyDonations,
  updateDonation,
  deleteDonation,
};
