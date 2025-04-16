import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store';

/** Typed `useDispatch` so thunks and RTK Query actions keep their types. */
export const useAppDispatch: () => AppDispatch = useDispatch;
