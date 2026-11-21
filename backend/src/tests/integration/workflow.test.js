const {
  account,
  database,
  donationPayload,
  loginAccount,
  registerAccount,
  registerIntegrationHooks,
  request,
  app,
} = require('./support');

registerIntegrationHooks();

describe('FoodBridge donor-to-volunteer workflow', () => {
  it('registers, requests, approves, collects, and delivers food with persisted state', async () => {
    const donorAccount = account('DONOR');
    const donorRegistration = await registerAccount(donorAccount);
    expect(donorRegistration.status).toBe(201);
    expect(donorRegistration.body.user.password_hash).toBeUndefined();

    const donorLogin = await loginAccount(donorAccount);
    expect(donorLogin.status).toBe(200);
    const donorToken = donorLogin.body.token;

    const donationResponse = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send(donationPayload('workflow meal'));
    expect(donationResponse.status).toBe(201);
    const donation = donationResponse.body.donation;

    const ngoAccount = account('NGO');
    const ngoRegistration = await registerAccount(ngoAccount);
    expect(ngoRegistration.status).toBe(201);
    const ngoLogin = await loginAccount(ngoAccount);
    expect(ngoLogin.status).toBe(200);
    const ngoToken = ngoLogin.body.token;

    const listings = await request(app).get('/api/donations');
    expect(listings.status).toBe(200);
    expect(listings.body.donations.map((item) => String(item.id))).toContain(String(donation.id));

    const pickupResponse = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${ngoToken}`)
      .send({ donation_id: donation.id, notes: 'Integration workflow pickup' });
    expect(pickupResponse.status).toBe(201);
    const pickupId = pickupResponse.body.pickup.id;

    const approval = await request(app)
      .patch(`/api/pickups/${pickupId}/status`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ status: 'APPROVED' });
    expect(approval.status).toBe(200);
    expect(approval.body.pickup.status).toBe('APPROVED');

    const volunteerAccount = account('VOLUNTEER');
    const volunteerRegistration = await registerAccount(volunteerAccount);
    expect(volunteerRegistration.status).toBe(201);
    const volunteerLogin = await loginAccount(volunteerAccount);
    expect(volunteerLogin.status).toBe(200);
    const volunteerToken = volunteerLogin.body.token;

    const assignment = await request(app)
      .patch(`/api/volunteers/tasks/${pickupId}/accept`)
      .set('Authorization', `Bearer ${volunteerToken}`);
    expect(assignment.status).toBe(200);

    for (const status of ['ACCEPTED', 'COLLECTED', 'DELIVERED']) {
      const update = await request(app)
        .patch(`/api/volunteers/tasks/${pickupId}/status`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ status });
      expect(update.status).toBe(200);
      expect(update.body.task.status).toBe(status);
    }

    const [persistedPickup, persistedDonation] = await Promise.all([
      database.query('SELECT status, volunteer_id FROM pickup_requests WHERE id = $1', [pickupId]),
      database.query('SELECT status FROM donations WHERE id = $1', [donation.id]),
    ]);

    expect(persistedPickup.rows[0]).toMatchObject({
      status: 'DELIVERED',
      volunteer_id: volunteerRegistration.body.user.id,
    });
    expect(persistedDonation.rows[0].status).toBe('COMPLETED');
  });
});
