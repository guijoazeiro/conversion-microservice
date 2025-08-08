import { HttpError } from '../../errors/HttpError';
import { TaskRepository } from '../../repositories/TaskRepository';
import QueueService from '../queue/QueueService';
import {
  BAD_REQUEST_CODE,
  ALLOWED_FORMATS_MAP,
  STATUS_PENDING,
} from '../../utils/constants';
import { MediaType, Task } from '../../utils/types';

export class ConversionService {
  constructor(
    private taskRepository = new TaskRepository(),
    private queueService = new QueueService(),
  ) {
    this.taskRepository = taskRepository;
    this.queueService = queueService;
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
      path: file.path,
      mimetype: file.mimetype,
      format,
      fileSize: file.size,
      originalName: file.originalname,
      storedName: file.filename,
      status: STATUS_PENDING,
    };

    const task = await this.taskRepository.create(conversionData);

    if (!task) {
      throw new HttpError('Erro ao criar tarefa', BAD_REQUEST_CODE);
    }

    const queueData = {
      id: task.id,
      path: conversionData.path,
      mimetype: conversionData.mimetype,
      format: conversionData.format,
      fileSize: conversionData.fileSize,
      status: conversionData.status,
    };

    await this.queueService.addConversionJob(queueData);

    return task;
  }
}
