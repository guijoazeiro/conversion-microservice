import { Request, Response } from 'express';
import { FileService } from '../service/file/FileService';
import { HttpError } from '../errors/HttpError';
import { ERRORS, INTERNAL_SERVER_ERROR_CODE } from '../utils/constants';
import logger from '../config/logger';

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
        .json({ error: ERRORS.INTERNAL_SERVER });
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
        .json({ error: ERRORS.INTERNAL_SERVER });
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
      logger.error(error);
      res
        .status(INTERNAL_SERVER_ERROR_CODE)
        .json({ error: ERRORS.INTERNAL_SERVER });
    }
  }
}
