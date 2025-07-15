import { Request, Response } from 'express';
import { StatusService } from '../service/StatusService';

export class StatusController {
  constructor(private statusService = new StatusService()) {
    this.statusService = statusService;
  }

  async getStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const status = await this.statusService.getStatus(id);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao verificar status' });
    }
  }
}
