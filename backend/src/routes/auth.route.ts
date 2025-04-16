import { Router } from 'express';
import { body } from 'express-validator';
import { createAuthController } from '../controllers/auth.controller';
import { asyncHandler } from '../lib/async-handler';
import { validate } from '../middleware/validate';
import { AuthService } from '../services/auth.service';

const credentialRules = [
  body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
];

export function createAuthRouter(service: AuthService): Router {
  const controller = createAuthController(service);
  const router = Router();

  router.post('/signup', credentialRules, validate, asyncHandler(controller.signup));
  router.post(
    '/login',
    [body('email').isEmail().withMessage('A valid email address is required').normalizeEmail(), body('password').isString().notEmpty()],
    validate,
    asyncHandler(controller.login)
  );

  return router;
}
