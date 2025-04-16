import { Router } from 'express';
import { body } from 'express-validator';
import { createAuthController } from '../controllers/auth.controller';
import { asyncHandler } from '../lib/async-handler';
import { validate } from '../middleware/validate';
import { AuthService } from '../services/auth.service';

// Only trim and lower-case. express-validator's normalizeEmail() also strips
// dots and "+tag" suffixes from Gmail addresses, which silently changed the
// stored email and merged distinct addresses into one account.
const emailRule = () =>
  body('email').trim().isEmail().withMessage('A valid email address is required').toLowerCase();

const credentialRules = [
  emailRule(),
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
    [emailRule(), body('password').isString().notEmpty()],
    validate,
    asyncHandler(controller.login)
  );

  return router;
}
