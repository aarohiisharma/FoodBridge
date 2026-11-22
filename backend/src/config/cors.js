const env = require('./env');
const AppError = require('../utils/AppError');

const corsOptions = {
  origin(origin, callback) {
    const originUrl = origin ? new URL(origin) : null;
    const isLocalOrigin =
      originUrl
      && ['localhost', '127.0.0.1'].includes(originUrl.hostname);
    const isVercelOrigin =
      originUrl
      && originUrl.hostname.endsWith('.vercel.app');

    if (
      !origin
      || env.corsOrigins.length === 0
      || env.corsOrigins.includes(origin)
      || isLocalOrigin
      || isVercelOrigin
    ) {
      callback(null, true);
      return;
    }

    callback(new AppError('Origin not allowed by CORS', 403));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = { corsOptions };
