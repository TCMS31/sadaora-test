/**
 * Boots the real API — real routes, middleware, validation and services —
 * against the in-memory driver, pre-populated with demo content.
 *
 *   npm run demo
 *
 * This is how the screenshots in the README were captured and how the SPA can
 * be exercised end to end without a PostgreSQL server. It is a development
 * convenience, not a deployment target: all data is lost when the process
 * exits.
 */
/* eslint-disable no-console */
import { createApp } from '../src/app';
import { createMemoryDataStore } from '../src/repositories/memory';
import { DEMO_ACCOUNT, DEMO_PASSWORD, seedDemoData } from './seed';

const port = Number.parseInt(process.env.PORT ?? '3001', 10);

async function main(): Promise<void> {
  const store = createMemoryDataStore();
  await seedDemoData(store);

  createApp({ store }).listen(port, () => {
    console.log(`Demo API (in-memory) listening on http://localhost:${port}`);
    console.log(`Sign in as ${DEMO_ACCOUNT.email} / ${DEMO_PASSWORD}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
