import { Router } from 'express';
import { FileController } from '../controller/FileController';

const router = Router();
const fileController = new FileController();

router.get('/status/:id', (req, res) => fileController.getStatus(req, res));
router.get('/download/:id', (req, res) => fileController.download(req, res));
router.get('/', (req, res) => fileController.getFiles(req, res));

export default router;
