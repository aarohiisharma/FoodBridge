const AppError = require('../utils/AppError');
const { verifyToken } = require('../config/jwt');

function authenticate(request, response, next) {
  const authorization = request.get('Authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    request.user = verifyToken(token);
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
}

module.exports = authenticate;
