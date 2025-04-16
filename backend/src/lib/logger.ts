/* eslint-disable no-console */
type Level = 'info' | 'warn' | 'error';

const silent = process.env.NODE_ENV === 'test';

function emit(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (silent) return;
  const line = meta ? `${message} ${JSON.stringify(meta)}` : message;
  console[level](`[${new Date().toISOString()}] ${level.toUpperCase()} ${line}`);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
};
