import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../services/api';

/**
 * Renders a component with a *fresh* store, so RTK Query's cache never leaks
 * between tests.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {}
): RenderResult {
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>
  );
}
