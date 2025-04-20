import { Request, Response } from 'express';
import { config } from '../config/env';
import { toFeedProfileDto, toPageMeta, toProfileDto } from '../dto/profile.dto';
import { currentUserId } from '../middleware/require-auth';
import { ProfileService } from '../services/profile.service';

/** Absolute origin of the current request, used to expand stored photo paths. */
function originOf(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

function positiveInt(raw: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createProfileController(service: ProfileService) {
  return {
    async getMine(req: Request, res: Response): Promise<void> {
      const profile = await service.getMine(currentUserId(req));
      res.json(toProfileDto(profile, originOf(req)));
    },

    async save(req: Request, res: Response): Promise<void> {
      const profile = await service.save(currentUserId(req), {
        name: req.body.name,
        headline: req.body.headline,
        bio: req.body.bio,
        interests: req.body.interests,
        photoPath: req.file ? `/uploads/${req.file.filename}` : undefined,
      });
      res.json(toProfileDto(profile, originOf(req)));
    },

    async remove(req: Request, res: Response): Promise<void> {
      await service.remove(currentUserId(req));
      res.status(204).send();
    },

    async feed(req: Request, res: Response): Promise<void> {
      const { items, total, page, limit } = await service.feed(
        currentUserId(req),
        positiveInt(req.query.page, 1),
        positiveInt(req.query.limit, config.feedPageSize)
      );
      const origin = originOf(req);
      res.json({
        data: items.map((item) => toFeedProfileDto(item, origin)),
        meta: toPageMeta(page, limit, total),
      });
    },

    async like(req: Request, res: Response): Promise<void> {
      res.json(await service.like(currentUserId(req), req.params.id));
    },

    async unlike(req: Request, res: Response): Promise<void> {
      res.json(await service.unlike(currentUserId(req), req.params.id));
    },
  };
}
