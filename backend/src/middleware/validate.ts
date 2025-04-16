import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { HttpError } from '../lib/http-error';

/**
 * Turns express-validator's result into a single 400 with a field map.
 * The original app listed `express-validator` as a dependency and never
 * imported it, so `POST /api/auth/signup` with an empty body reached
 * `bcrypt.hash(undefined)` and rejected.
 */
export function validate(req: Request, _res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const details: Record<string, string> = {};
  for (const error of result.array()) {
    const field = 'path' in error ? String(error.path) : 'body';
    if (!details[field]) details[field] = error.msg;
  }

  next(HttpError.badRequest('Validation failed', details));
}
