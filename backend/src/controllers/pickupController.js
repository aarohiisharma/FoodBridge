const pickupService = require('../services/pickupService');
const asyncHandler = require('../utils/asyncHandler');

const createPickup = asyncHandler(async (request, response) => {
  const pickup = await pickupService.createPickup(request.user.id, request.body);
  response.status(201).json({ success: true, pickup });
});

const listPickups = asyncHandler(async (request, response) => {
  const pickups = await pickupService.listPickups(request.user);
  response.status(200).json({ success: true, pickups });
});

const updateStatus = asyncHandler(async (request, response) => {
  const pickup = await pickupService.updatePickupStatus(
    request.params.id,
    request.user,
    request.body.status,
    request.body.volunteer_id,
  );
  response.status(200).json({ success: true, pickup });
});

const cancelPickup = asyncHandler(async (request, response) => {
  const pickup = await pickupService.cancelPickup(request.params.id, request.user.id);
  response.status(200).json({ success: true, pickup });
});

module.exports = { createPickup, listPickups, updateStatus, cancelPickup };
