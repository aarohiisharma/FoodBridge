-- DEVELOPMENT-ONLY fixtures. All identities and locations below are fictional.
-- Password hashes are for discarded random values; no sample login password is provided.
BEGIN;

INSERT INTO users (name, email, password_hash, phone, role)
VALUES
    (
        'Development Donor',
        'foodbridge.dev.donor@example.invalid',
        '$2b$12$6STDXchotYBEhxtow/.E0OOSXoY5PGE8GpO0H8kVWDV8YUZECMNAa',
        NULL,
        'DONOR'
    ),
    (
        'Development NGO User',
        'foodbridge.dev.ngo@example.invalid',
        '$2b$12$6STDXchotYBEhxtow/.E0OOSXoY5PGE8GpO0H8kVWDV8YUZECMNAa',
        NULL,
        'NGO'
    ),
    (
        'Development Volunteer',
        'foodbridge.dev.volunteer@example.invalid',
        '$2b$12$6STDXchotYBEhxtow/.E0OOSXoY5PGE8GpO0H8kVWDV8YUZECMNAa',
        NULL,
        'VOLUNTEER'
    )
ON CONFLICT (lower(email)) DO NOTHING;

INSERT INTO ngo_profiles (user_id, organization_name, registration_number, verification_status)
SELECT id, 'FoodBridge Development NGO', 'DEV-SEED-0001', 'VERIFIED'
FROM users
WHERE email = 'foodbridge.dev.ngo@example.invalid'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO donations (
    donor_id,
    food_name,
    food_type,
    quantity,
    quantity_unit,
    preparation_time,
    expiry_time,
    description,
    pickup_location,
    status
)
SELECT
    id,
    'Development Produce Box',
    'Produce',
    8.000,
    'kg',
    now() - INTERVAL '1 hour',
    now() + INTERVAL '23 hours',
    'DEVELOPMENT SEED: fictional produce donation A.',
    'Development-only sample location; no real address.',
    'CLAIMED'
FROM users
WHERE email = 'foodbridge.dev.donor@example.invalid'
  AND NOT EXISTS (
      SELECT 1
      FROM donations
      WHERE donor_id = users.id
        AND description = 'DEVELOPMENT SEED: fictional produce donation A.'
  );

INSERT INTO donations (
    donor_id,
    food_name,
    food_type,
    quantity,
    quantity_unit,
    preparation_time,
    expiry_time,
    description,
    pickup_location,
    status
)
SELECT
    id,
    'Development Bakery Surplus',
    'Bakery',
    24.000,
    'portions',
    now() - INTERVAL '30 minutes',
    now() + INTERVAL '12 hours',
    'DEVELOPMENT SEED: fictional bakery donation B.',
    'Development-only sample location; no real address.',
    'AVAILABLE'
FROM users
WHERE email = 'foodbridge.dev.donor@example.invalid'
  AND NOT EXISTS (
      SELECT 1
      FROM donations
      WHERE donor_id = users.id
        AND description = 'DEVELOPMENT SEED: fictional bakery donation B.'
  );

INSERT INTO pickup_requests (donation_id, ngo_id, volunteer_id, status, notes)
SELECT d.id, ngo.id, volunteer.id, 'ASSIGNED',
       'DEVELOPMENT SEED: assigned sample pickup A.'
FROM donations AS d
JOIN users AS donor ON donor.id = d.donor_id
JOIN users AS ngo ON ngo.email = 'foodbridge.dev.ngo@example.invalid'
JOIN users AS volunteer ON volunteer.email = 'foodbridge.dev.volunteer@example.invalid'
WHERE donor.email = 'foodbridge.dev.donor@example.invalid'
  AND d.description = 'DEVELOPMENT SEED: fictional produce donation A.'
  AND NOT EXISTS (
      SELECT 1
      FROM pickup_requests AS existing
      WHERE existing.donation_id = d.id
        AND existing.ngo_id = ngo.id
        AND existing.notes = 'DEVELOPMENT SEED: assigned sample pickup A.'
  );

INSERT INTO pickup_requests (donation_id, ngo_id, status, notes)
SELECT d.id, ngo.id, 'PENDING',
       'DEVELOPMENT SEED: pending sample pickup B.'
FROM donations AS d
JOIN users AS donor ON donor.id = d.donor_id
JOIN users AS ngo ON ngo.email = 'foodbridge.dev.ngo@example.invalid'
WHERE donor.email = 'foodbridge.dev.donor@example.invalid'
  AND d.description = 'DEVELOPMENT SEED: fictional bakery donation B.'
  AND NOT EXISTS (
      SELECT 1
      FROM pickup_requests AS existing
      WHERE existing.donation_id = d.id
        AND existing.ngo_id = ngo.id
        AND existing.notes = 'DEVELOPMENT SEED: pending sample pickup B.'
  );

INSERT INTO pickup_status_history (
    pickup_request_id,
    previous_status,
    status,
    changed_by_user_id,
    note
)
SELECT p.id, 'APPROVED', 'ASSIGNED', donor.id,
       'DEVELOPMENT SEED: volunteer assignment sample.'
FROM pickup_requests AS p
JOIN donations AS d ON d.id = p.donation_id
JOIN users AS donor ON donor.id = d.donor_id
WHERE p.notes = 'DEVELOPMENT SEED: assigned sample pickup A.'
  AND NOT EXISTS (
      SELECT 1
      FROM pickup_status_history AS history
      WHERE history.pickup_request_id = p.id
        AND history.previous_status = 'APPROVED'
        AND history.status = 'ASSIGNED'
  );

INSERT INTO pickup_status_history (
    pickup_request_id,
    previous_status,
    status,
    changed_by_user_id,
    note
)
SELECT p.id, NULL, 'PENDING', ngo.id,
       'DEVELOPMENT SEED: initial pickup request.'
FROM pickup_requests AS p
JOIN users AS ngo ON ngo.id = p.ngo_id
WHERE p.notes = 'DEVELOPMENT SEED: pending sample pickup B.'
  AND NOT EXISTS (
      SELECT 1
      FROM pickup_status_history AS history
      WHERE history.pickup_request_id = p.id
        AND history.previous_status IS NULL
        AND history.status = 'PENDING'
  );

INSERT INTO notifications (user_id, type, message, pickup_request_id)
SELECT volunteer.id,
       'PICKUP_ASSIGNED',
       'Development-only sample pickup assigned.',
       p.id
FROM pickup_requests AS p
JOIN users AS volunteer ON volunteer.email = 'foodbridge.dev.volunteer@example.invalid'
WHERE p.notes = 'DEVELOPMENT SEED: assigned sample pickup A.'
  AND NOT EXISTS (
      SELECT 1
      FROM notifications AS existing
      WHERE existing.user_id = volunteer.id
        AND existing.type = 'PICKUP_ASSIGNED'
        AND existing.pickup_request_id = p.id
  );

COMMIT;
