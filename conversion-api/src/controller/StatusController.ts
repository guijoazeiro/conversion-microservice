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
  async download(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = await this.statusService.download(id);
      res.download(file);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Arquivo não encontrado'
      ) {
        return res.status(404).json({ error: error.message });
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao fazer download';
      res.status(500).json({ error: errorMessage });
    }
  }
}
