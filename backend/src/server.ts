import { createApp } from './app';
import { config } from './config/env';
import { logger } from './lib/logger';
import { createDataStore } from './repositories';

const store = createDataStore();
const app = createApp({ store });

const server = app.listen(config.port, () => {
  logger.info(`API listening on http://localhost:${config.port}`, {
    driver: config.dataDriver,
    env: config.nodeEnv,
  });
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down`);
  server.close(async () => {
    await store.disconnect?.();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
