import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * Controllers are deliberately thin: read the request, call one service
 * method, choose a status code. No Prisma, no bcrypt, no jwt in this layer.
 */
export function createAuthController(service: AuthService) {
  return {
    async signup(req: Request, res: Response): Promise<void> {
      const result = await service.signup({ email: req.body.email, password: req.body.password });
      res.status(201).json(result);
    },

    async login(req: Request, res: Response): Promise<void> {
      const result = await service.login({ email: req.body.email, password: req.body.password });
      res.status(200).json(result);
    },
  };
}
