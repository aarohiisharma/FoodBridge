const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const updateProfile = asyncHandler(async (request, response) => {
  const user = await authService.updateProfile(request.user.id, request.body);
  response.status(200).json({ success: true, user });
});

module.exports = { updateProfile };
