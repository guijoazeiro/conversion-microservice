import { Request, Response } from 'express';
import { FileService } from '../service/FileService';
import { HttpError } from '../errors/HttpError';

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
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao verificar status' });
    }
  }
  async download(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = await this.fileService.download(id);
      res.download(file);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao baixar arquivo' });
    }
  }
}
