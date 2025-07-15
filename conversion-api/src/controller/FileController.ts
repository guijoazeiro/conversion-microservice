import { Request, Response } from 'express';
import { FileService } from '../service/FileService';

export class FileController {
  constructor(private fileService = new FileService()) {
    this.fileService = fileService;
  }

  async getStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const status = await this.fileService.getStatus(id);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao verificar status' });
    }
  }
  async download(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = await this.fileService.download(id);
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
