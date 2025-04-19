import { randomUUID } from 'crypto';
import fs from 'fs';
import multer from 'multer';
import { config } from '../config/env';
import { HttpError } from '../lib/http-error';

const ALLOWED_MIME_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

export function ensureUploadDir(dir: string = config.uploadDir): string {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ensureUploadDir()),
  filename: (_req, file, cb) => {
    // The extension comes from the validated MIME type, never from the
    // client-supplied filename. The original derived it from
    // `path.extname(file.originalname)`, so `avatar.html` landed in a
    // directory served by `express.static` — a stored-XSS upload.
    cb(null, `photo-${randomUUID()}${ALLOWED_MIME_TYPES.get(file.mimetype)}`);
  },
});

export const uploadProfilePhoto = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(HttpError.badRequest(`Unsupported image type "${file.mimetype}"`));
      return;
    }
    cb(null, true);
  },
}).single('photo');
