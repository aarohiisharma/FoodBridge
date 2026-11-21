const {
  account,
  database,
  donationPayload,
  loginAccount,
  registerAccount,
  registerAndLogin,
  registerIntegrationHooks,
  request,
  app,
} = require('./support');

registerIntegrationHooks();

describe('FoodBridge integration failure scenarios', () => {
  it('rejects invalid credentials and duplicate registration email', async () => {
    const donor = account('DONOR');
    const registration = await registerAccount(donor);
    expect(registration.status).toBe(201);

    const duplicate = await registerAccount({ ...donor, name: 'Duplicate integration donor' });
    expect(duplicate.status).toBe(409);

    const invalidLogin = await loginAccount({ ...donor, password: 'Wrong-Integration-Password!' });
    expect(invalidLogin.status).toBe(401);
  });

  it('rejects protected API access without authentication', async () => {
    const response = await request(app)
      .post('/api/donations')
      .send(donationPayload('unauthorized meal'));
    expect(response.status).toBe(401);
  });

  it('rejects pickup requests for expired donations', async () => {
    const donor = await registerAndLogin(account('DONOR'));
    const ngo = await registerAndLogin(account('NGO'));
    const expired = await database.query(
      `INSERT INTO donations (
         donor_id, food_name, food_type, quantity, quantity_unit,
         preparation_time, expiry_time, pickup_location, status
       )
       SELECT $1, 'Expired integration food', 'OTHER', 1, 'portion',
              now() - interval '3 days', now() - interval '2 days',
              'Integration test fixture location', 'AVAILABLE'
       RETURNING id`,
      [donor.user.id],
    );

    const response = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${ngo.token}`)
      .send({ donation_id: expired.rows[0].id });
    expect(response.status).toBe(404);
  });

  it('rejects a second pending pickup request by the same NGO', async () => {
    const donor = await registerAndLogin(account('DONOR'));
    const ngo = await registerAndLogin(account('NGO'));
    const donation = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donor.token}`)
      .send(donationPayload('duplicate pickup meal'));
    expect(donation.status).toBe(201);

    const payload = { donation_id: donation.body.donation.id };
    const first = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${ngo.token}`)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${ngo.token}`)
      .send(payload);
    expect(second.status).toBe(409);
  });

  it('rejects an assignment to an existing non-volunteer user', async () => {
    const donor = await registerAndLogin(account('DONOR'));
    const ngo = await registerAndLogin(account('NGO'));
    const donation = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donor.token}`)
      .send(donationPayload('invalid volunteer meal'));
    expect(donation.status).toBe(201);

    const pickup = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${ngo.token}`)
      .send({ donation_id: donation.body.donation.id });
    expect(pickup.status).toBe(201);

    const approval = await request(app)
      .patch(`/api/pickups/${pickup.body.pickup.id}/status`)
      .set('Authorization', `Bearer ${donor.token}`)
      .send({ status: 'APPROVED' });
    expect(approval.status).toBe(200);

    const assignment = await request(app)
      .patch(`/api/pickups/${pickup.body.pickup.id}/status`)
      .set('Authorization', `Bearer ${donor.token}`)
      .send({ status: 'ASSIGNED', volunteer_id: donor.user.id });
    expect(assignment.status).toBeGreaterThanOrEqual(400);
    expect(assignment.status).toBeLessThan(500);
  });

  it('rejects an NGO attempting a donor-only approval', async () => {
    const donor = await registerAndLogin(account('DONOR'));
    const ngo = await registerAndLogin(account('NGO'));
    const donation = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donor.token}`)
      .send(donationPayload('unauthorized approval meal'));
    expect(donation.status).toBe(201);

    const pickup = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${ngo.token}`)
      .send({ donation_id: donation.body.donation.id });
    expect(pickup.status).toBe(201);

    const unauthorizedApproval = await request(app)
      .patch(`/api/pickups/${pickup.body.pickup.id}/status`)
      .set('Authorization', `Bearer ${ngo.token}`)
      .send({ status: 'APPROVED' });
    expect(unauthorizedApproval.status).toBe(403);
  });
});
