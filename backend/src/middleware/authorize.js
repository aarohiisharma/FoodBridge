const AppError = require('../utils/AppError');

function authorize(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const userRole = String(request.user.role || '').toUpperCase();
    const roles = allowedRoles.map((role) => String(role).toUpperCase());

    if (!roles.includes(userRole)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }

    next();
  };
}

module.exports = authorize;
