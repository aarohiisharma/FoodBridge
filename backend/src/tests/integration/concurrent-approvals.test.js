const {
  account,
  database,
  donationPayload,
  registerAndLogin,
  registerIntegrationHooks,
  request,
  app,
} = require('./support');

registerIntegrationHooks();

describe('concurrent pickup approvals', () => {
  it('allows at most one NGO request for a donation to be approved', async () => {
    const donor = await registerAndLogin(account('DONOR'));
    const firstNgo = await registerAndLogin(account('NGO', 1));
    const secondNgo = await registerAndLogin(account('NGO', 2));
    const donationResponse = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donor.token}`)
      .send(donationPayload('concurrent approval meal'));
    expect(donationResponse.status).toBe(201);
    const donationId = donationResponse.body.donation.id;

    const [firstRequest, secondRequest] = await Promise.all([
      request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${firstNgo.token}`)
        .send({ donation_id: donationId }),
      request(app)
        .post('/api/pickups')
        .set('Authorization', `Bearer ${secondNgo.token}`)
        .send({ donation_id: donationId }),
    ]);
    expect(firstRequest.status).toBe(201);
    expect(secondRequest.status).toBe(201);

    const approvals = await Promise.all([
      request(app)
        .patch(`/api/pickups/${firstRequest.body.pickup.id}/status`)
        .set('Authorization', `Bearer ${donor.token}`)
        .send({ status: 'APPROVED' }),
      request(app)
        .patch(`/api/pickups/${secondRequest.body.pickup.id}/status`)
        .set('Authorization', `Bearer ${donor.token}`)
        .send({ status: 'APPROVED' }),
    ]);

    expect(approvals.map((response) => response.status).sort()).toEqual([200, 409]);

    const [approved, donation] = await Promise.all([
      database.query(
        `SELECT count(*)::int AS count
         FROM pickup_requests
         WHERE donation_id = $1 AND status = 'APPROVED'`,
        [donationId],
      ),
      database.query('SELECT status FROM donations WHERE id = $1', [donationId]),
    ]);
    expect(approved.rows[0].count).toBe(1);
    expect(donation.rows[0].status).toBe('CLAIMED');
  });
});
