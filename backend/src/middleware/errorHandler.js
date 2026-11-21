const env = require('../config/env');
const AppError = require('../utils/AppError');

function notFoundHandler(request, response, next) {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
}

function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500;
  const responseBody = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message,
  };

  if (error.details) {
    responseBody.errors = error.details;
  }

  if (env.nodeEnv !== 'production' && statusCode === 500) {
    responseBody.stack = error.stack;
  }

  if (statusCode === 500) {
    console.error(error);
  }

  response.status(statusCode).json(responseBody);
}

module.exports = { notFoundHandler, errorHandler };
