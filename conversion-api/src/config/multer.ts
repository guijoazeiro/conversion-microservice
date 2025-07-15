import { mkdirSync } from 'fs';
import multer from 'multer';
import { uploadDir } from './enviroment';
import { v4 as uuid } from 'uuid';

mkdirSync(uploadDir, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
      const id = uuid();
      const ext = file.originalname.split('.').pop();
      cb(null, `${id}.${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
