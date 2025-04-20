import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` once a bearer token has been verified. */
      userId?: string;
    }
  }
}

export {};
