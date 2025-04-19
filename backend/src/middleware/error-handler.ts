import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { config } from '../config/env';
import { HttpError } from '../lib/http-error';
import { logger } from '../lib/logger';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(HttpError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

function normalise(error: unknown): HttpError {
  if (error instanceof HttpError) return error;

  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return HttpError.payloadTooLarge(
        `Image exceeds the ${Math.round(config.maxUploadBytes / 1024)} KB limit`
      );
    }
    return HttpError.badRequest(error.message);
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return HttpError.badRequest('Request body is not valid JSON');
  }

  return new HttpError(500, 'Something went wrong', 'INTERNAL_ERROR');
}

/**
 * The single place an error becomes a response. Anything unrecognised is
 * reported as a generic 500 so driver-level messages (Prisma SQL, file paths)
 * never reach a client.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const httpError = normalise(error);

  if (httpError.status >= 500) {
    logger.error('Unhandled error', {
      method: req.method,
      path: req.originalUrl,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  res.status(httpError.status).json({
    error: {
      code: httpError.code,
      message: httpError.message,
      ...(httpError.details ? { details: httpError.details } : {}),
    },
  });
}
