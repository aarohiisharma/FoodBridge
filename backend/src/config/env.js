const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  nodeEnv,
  port: Number.parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

if (!env.databaseUrl && nodeEnv !== 'test') {
  const pgContractConfigured =
    process.env.PGHOST &&
    process.env.PGDATABASE &&
    process.env.PGUSER &&
    process.env.PGPASSWORD;

  if (!pgContractConfigured) {
    console.warn(
      'Database configuration is missing. Set DATABASE_URL or the PGHOST, PGDATABASE, PGUSER, and PGPASSWORD variables.',
    );
  }
}

if (!env.jwtSecret) {
  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  env.jwtSecret = 'foodbridge-development-only-secret';
}

module.exports = env;
