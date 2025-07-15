import { Request, Response, Router } from 'express';
import { ConvertController } from '../controller/ConvertController';
import { upload } from '../config/multer';

const router = Router();
const convertController = new ConvertController();

router.post(
  '/convert',
  upload.single('file'),
  (req: Request, res: Response) => {
    convertController.handle(req, res);
  },
);
export default router;
