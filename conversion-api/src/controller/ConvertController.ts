import { Request, Response } from 'express';
import { ConversionService } from '../service/conversion/ConversionService';
import { HttpError } from '../errors/HttpError';
import { BAD_REQUEST_CODE, CREATED_CODE } from '../utils/constants';

export class ConvertController {
  constructor(private convertService = new ConversionService()) {
    this.convertService = convertService;
  }

  async handle(req: Request, res: Response) {
    try {
      const file = req.file;
      const { format } = req.body;

      if (!file)
        return res
          .status(BAD_REQUEST_CODE)
          .json({ error: 'Nenhum arquivo enviado' });

      const task = await this.convertService.process({ file, format });

      res.status(CREATED_CODE).json(task);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao converter arquivo' });
    }
  }
}
