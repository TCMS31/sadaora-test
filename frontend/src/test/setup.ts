import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  window.localStorage.clear();
});

afterAll(() => server.close());

// jsdom does not implement these; several components rely on them.
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'blob:mock';
  window.URL.revokeObjectURL = () => undefined;
}
