import { Request, Response } from 'express';
import { FileService } from '../service/file/FileService';
import { HttpError } from '../errors/HttpError';
import { INTERNAL_SERVER_ERROR_CODE } from '../utils/constants';

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
      res
        .status(INTERNAL_SERVER_ERROR_CODE)
        .json({ error: 'Erro ao verificar status' });
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
      res
        .status(INTERNAL_SERVER_ERROR_CODE)
        .json({ error: 'Erro ao baixar arquivo' });
    }
  }

  async getFiles(req: Request, res: Response) {
    try {
      const { status, format, page, limit } = req.query;
      const result = await this.fileService.getFiles({
        status,
        format,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json(result);
    } catch (error) {
      console.error(error); // Log do erro para debug
      res
        .status(INTERNAL_SERVER_ERROR_CODE)
        .json({ error: 'Erro ao buscar arquivos' });
    }
  }
}
