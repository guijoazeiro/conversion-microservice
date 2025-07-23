import { Request, Response } from 'express';
import { ConversionService } from '../service/conversion';
import { HttpError } from '../errors/HttpError';

export class ConvertController {
  constructor(private convertService = new ConversionService()) {
    this.convertService = convertService;
  }

  async handle(req: Request, res: Response) {
    try {
      const file = req.file;
      const { format } = req.body;

      if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

      const task = await this.convertService.process({ file, format });

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao converter arquivo' });
    }
  }
}
