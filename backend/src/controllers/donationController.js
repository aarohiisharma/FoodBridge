const donationService = require('../services/donationService');
const asyncHandler = require('../utils/asyncHandler');

const createDonation = asyncHandler(async (request, response) => {
  const donation = await donationService.createDonation(request.user.id, request.body);
  response.status(201).json({ success: true, donation });
});

const listDonations = asyncHandler(async (request, response) => {
  const donations = await donationService.listAvailableDonations(request.query);
  response.status(200).json({ success: true, donations });
});

const getDonation = asyncHandler(async (request, response) => {
  const donation = await donationService.getAvailableDonationById(request.params.id);
  response.status(200).json({ success: true, donation });
});

const getMyDonations = asyncHandler(async (request, response) => {
  const donations = await donationService.getMyDonations(request.user.id);
  response.status(200).json({ success: true, donations });
});

const updateDonation = asyncHandler(async (request, response) => {
  const donation = await donationService.updateDonation(
    request.params.id,
    request.user.id,
    request.body,
  );
  response.status(200).json({ success: true, donation });
});

const deleteDonation = asyncHandler(async (request, response) => {
  await donationService.deleteDonation(request.params.id, request.user.id);
  response.status(200).json({ success: true, message: 'Donation deleted successfully' });
});

module.exports = {
  createDonation,
  listDonations,
  getDonation,
  getMyDonations,
  updateDonation,
  deleteDonation,
};
