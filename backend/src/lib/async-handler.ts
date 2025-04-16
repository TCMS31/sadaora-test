import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 does not await async handlers, so a rejected promise inside a
 * controller escapes the router entirely and the request hangs until the client
 * times out. Wrapping every async handler routes rejections to `next()` and
 * therefore to the central error middleware.
 */
export function asyncHandler<Req extends Request = Request>(
  handler: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req as Req, res, next).catch(next);
  };
}
