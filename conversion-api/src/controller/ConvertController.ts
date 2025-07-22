import { Request, Response } from 'express';
import { ConversionService } from '../service/conversion';

export class ConvertController {
  constructor(private convertService = new ConversionService()) {
    this.convertService = convertService;
  }

  async handle(req: Request, res: Response) {
    const file = req.file;
    const { format } = req.body;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const task = await this.convertService.process({ file, format });

    res.status(201).json(task);
  }
}
