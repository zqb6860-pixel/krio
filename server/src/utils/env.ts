import { logger } from './logger';

export function validateEnv(): void {
  const required = ['JWT_SECRET'];

  if (process.env.NODE_ENV === 'production') {
    required.push('CORS_ORIGIN');
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.fatal(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters for security');
  }
}
