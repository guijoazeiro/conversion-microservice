import { HttpError } from '../../errors/HttpError';
import { convertQueue } from '../../jobs/convert.queue';
import { TaskRepository } from '../../repositories/TaskRepository';
import {
  BAD_REQUEST_CODE,
  STATUS_PENDING,
  VIDEO_ALLOWED_FORMATS,
} from '../../utils/constants';

export class VideoService {
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
    if (!VIDEO_ALLOWED_FORMATS.includes(format)) {
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

    const id = file.filename.split('.')[0];

    const fileObject = {
      id,
      originalName: file.originalname,
      storedName: file.filename,
      mimetype: file.mimetype,
      path: file.path,
      format,
      status: STATUS_PENDING,
    };

    await this.taskRepository.create(fileObject);

    await convertQueue.add('convert', fileObject);
    return { id };
  }
}
