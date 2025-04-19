import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { HttpError } from './http-error';

export interface TokenPayload {
  userId: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (typeof decoded === 'string' || typeof decoded.userId !== 'string') {
      throw HttpError.invalidToken('Malformed token');
    }
    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw HttpError.invalidToken('Invalid or expired token');
  }
}
