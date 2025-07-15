import { Router } from 'express';
import { StatusController } from '../controller/StatusController';

const router = Router();
const statusController = new StatusController();

router.get('/status/:id', (req, res) => statusController.getStatus(req, res));

export default router;
