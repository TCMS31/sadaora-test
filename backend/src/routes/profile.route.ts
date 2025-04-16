import { Router } from 'express';
import { body } from 'express-validator';
import { createProfileController } from '../controllers/profile.controller';
import { asyncHandler } from '../lib/async-handler';
import { requireAuth } from '../middleware/require-auth';
import { uploadProfilePhoto } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { ProfileService } from '../services/profile.service';

const profileRules = [
  body('name').isString().trim().isLength({ min: 1, max: 80 }).withMessage('Name is required'),
  body('headline')
    .isString()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Headline is required'),
  body('bio').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Bio is required'),
  body('interests').optional({ values: 'falsy' }).isString().isLength({ max: 500 }),
];

export function createProfileRouter(service: ProfileService): Router {
  const controller = createProfileController(service);
  const router = Router();

  router.use(requireAuth);

  // `/feed` and `/me` are declared before any `/:id` route so a literal
  // segment can never be swallowed by the parameter pattern.
  router.get('/feed', asyncHandler(controller.feed));
  router.get('/me', asyncHandler(controller.getMine));
  router.post('/', uploadProfilePhoto, profileRules, validate, asyncHandler(controller.save));
  router.delete('/', asyncHandler(controller.remove));
  router.post('/:id/like', asyncHandler(controller.like));
  router.delete('/:id/like', asyncHandler(controller.unlike));

  return router;
}
