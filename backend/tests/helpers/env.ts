/**
 * Runs before any module is imported so `src/config/env.ts` resolves against a
 * deterministic environment. No test touches a database or the network.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATA_DRIVER = 'memory';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.BCRYPT_ROUNDS = '4';
process.env.FEED_PAGE_SIZE = '5';
process.env.MAX_UPLOAD_BYTES = '65536';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sadaora-uploads-'));
