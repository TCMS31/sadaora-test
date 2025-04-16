import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error';
import { verifyAccessToken } from '../lib/tokens';

const BEARER = /^Bearer\s+(.+)$/i;

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const match = BEARER.exec(req.headers.authorization ?? '');
  if (!match) {
    next(HttpError.invalidToken('Authorization header must be "Bearer <token>"'));
    return;
  }

  try {
    req.userId = verifyAccessToken(match[1]).userId;
    next();
  } catch (error) {
    next(error);
  }
}

/** Narrowing helper: routes behind `requireAuth` always have a user id. */
export function currentUserId(req: Request): string {
  if (!req.userId) throw HttpError.unauthorized();
  return req.userId;
}
