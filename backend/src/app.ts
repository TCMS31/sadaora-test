import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { ensureUploadDir } from './middleware/upload';
import { createDataStore } from './repositories';
import { DataStore } from './repositories/types';
import { createAuthRouter } from './routes/auth.route';
import { createProfileRouter } from './routes/profile.route';
import { createAuthService } from './services/auth.service';
import { createProfileService } from './services/profile.service';

export interface AppOptions {
  /** Injected by the tests and by the seeded demo server. */
  store?: DataStore;
}

/**
 * Composition root. `createApp` builds the object graph and returns an Express
 * app without binding a port, which is what makes the whole HTTP surface
 * testable with supertest and swappable onto any data driver.
 */
export function createApp({ store = createDataStore() }: AppOptions = {}): Express & { store: DataStore } {
  const app = express() as Express & { store: DataStore };
  app.store = store;

  app.disable('x-powered-by');
  app.use(
    helmet({
      // Profile photos are served from this origin and rendered by the SPA on
      // a different one; the default same-origin policy would block them.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  if (config.nodeEnv !== 'test') app.use(morgan('tiny'));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  app.use('/uploads', express.static(ensureUploadDir(), { maxAge: '1d', index: false }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', driver: config.dataDriver, uptime: process.uptime() });
  });

  app.use('/api/auth', createAuthRouter(createAuthService(store)));
  app.use('/api/profile', createProfileRouter(createProfileService(store)));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
