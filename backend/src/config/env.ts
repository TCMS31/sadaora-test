/**
 * Environment configuration.
 *
 * Every value the app reads from `process.env` is resolved once, here, and
 * validated at boot. Nothing else in the codebase touches `process.env`, so a
 * missing variable fails loudly on startup rather than as an `undefined` deep
 * inside a request handler.
 */
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export type DataDriver = 'prisma' | 'memory';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  dataDriver: DataDriver;
  uploadDir: string;
  maxUploadBytes: number;
  feedPageSize: number;
  maxFeedPageSize: number;
  bcryptRounds: number;
}

class ConfigError extends Error {}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new ConfigError(
      `Missing required environment variable ${name}. Copy backend/.env.sample to backend/.env and fill it in.`
    );
  }
  return value;
}

function integer(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new ConfigError(`Environment variable ${name} must be an integer, received "${raw}".`);
  }
  return parsed;
}

function driver(): DataDriver {
  const raw = (process.env.DATA_DRIVER ?? 'prisma').toLowerCase();
  if (raw !== 'prisma' && raw !== 'memory') {
    throw new ConfigError(`DATA_DRIVER must be "prisma" or "memory", received "${raw}".`);
  }
  return raw;
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: integer('PORT', 3001),
    // A dev fallback keeps `npm run dev` friction-free; production must be explicit.
    jwtSecret:
      process.env.NODE_ENV === 'production'
        ? required('JWT_SECRET')
        : required('JWT_SECRET', 'dev-only-insecure-secret'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    dataDriver: driver(),
    uploadDir: path.resolve(process.env.UPLOAD_DIR ?? path.join(__dirname, '../../uploads')),
    maxUploadBytes: integer('MAX_UPLOAD_BYTES', 2 * 1024 * 1024),
    feedPageSize: integer('FEED_PAGE_SIZE', 5),
    maxFeedPageSize: integer('MAX_FEED_PAGE_SIZE', 50),
    bcryptRounds: integer('BCRYPT_ROUNDS', 10),
  };
}

export const config = loadConfig();
