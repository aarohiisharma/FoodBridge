const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (request, response) => {
  const result = await authService.register(request.body);
  response.status(201).json({ success: true, ...result });
});

const login = asyncHandler(async (request, response) => {
  const { email, password } = request.body;
  const result = await authService.login(email, password);
  response.status(200).json({ success: true, ...result });
});

const me = asyncHandler(async (request, response) => {
  const user = await authService.getProfile(request.user.id);
  response.status(200).json({ success: true, user });
});

module.exports = { register, login, me };
