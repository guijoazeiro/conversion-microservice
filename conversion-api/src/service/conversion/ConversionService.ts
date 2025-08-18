import { HttpError } from '../../errors/HttpError';
import { TaskRepository } from '../../repositories/TaskRepository';
import {
  BAD_REQUEST_CODE,
  ALLOWED_FORMATS_MAP,
  STATUS_PENDING,
} from '../../utils/constants';
import { MediaType } from '../../utils/types';

export class ConversionService {
  constructor(private taskRepository = new TaskRepository()) {
    this.taskRepository = taskRepository;
  }

  async process({
    file,
    format,
  }: {
    file: Express.Multer.File;
    format: string;
  }) {
    const mediaType = file.mimetype.split('/')[0] as MediaType;

    const allowedFormats = ALLOWED_FORMATS_MAP[mediaType];

    if (!allowedFormats) {
      throw new HttpError(
        'Formato de arquivo para ser convertido inválido',
        BAD_REQUEST_CODE,
      );
    }

    if (!allowedFormats.includes(format)) {
      throw new HttpError(
        'Formato de arquivo para ser convertido inválido',
        BAD_REQUEST_CODE,
      );
    }

    const originalFileFormat = file.originalname.split('.').pop();

    if (originalFileFormat === format) {
      throw new HttpError(
        'Arquivo com o mesmo formato de saída',
        BAD_REQUEST_CODE,
      );
    }

    const conversionData = {
      inputPath: file.path,
      mimetype: file.mimetype,
      format,
      fileSize: file.size,
      originalName: file.originalname,
      storedName: file.filename,
      status: STATUS_PENDING,
    };

    const task = await this.taskRepository.createConversion(conversionData);

    if (!task) {
      throw new HttpError('Erro ao criar tarefa', BAD_REQUEST_CODE);
    }

    return task;
  }
}
