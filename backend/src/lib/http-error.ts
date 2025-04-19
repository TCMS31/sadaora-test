/**
 * Error type carrying an HTTP status. Services throw these; the central error
 * middleware is the only place that turns one into a response body.
 */
export class HttpError extends Error {
  readonly status: number;

  readonly code: string;

  readonly details?: unknown;

  constructor(status: number, message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): HttpError {
    return new HttpError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required'): HttpError {
    return new HttpError(401, message, 'UNAUTHORIZED');
  }

  /**
   * 401 with a distinct code. The client uses `INVALID_TOKEN` to decide that
   * the session is over and it should sign out; a plain 403 means "you are
   * signed in, but not allowed to do this", which must not log anyone out.
   */
  static invalidToken(message = 'Invalid or expired token'): HttpError {
    return new HttpError(401, message, 'INVALID_TOKEN');
  }

  static forbidden(message = 'Not allowed'): HttpError {
    return new HttpError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Not found'): HttpError {
    return new HttpError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string): HttpError {
    return new HttpError(409, message, 'CONFLICT');
  }

  static payloadTooLarge(message: string): HttpError {
    return new HttpError(413, message, 'PAYLOAD_TOO_LARGE');
  }
}
