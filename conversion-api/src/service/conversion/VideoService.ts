import { HttpError } from '../../errors/HttpError';
import { convertQueue } from '../../jobs/convert.queue';
import { TaskRepository } from '../../repositories/TaskRepository';

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
    const allowedFormats = ['mp3', 'wav', 'avi', 'mp4', 'mkv'];

    if (!allowedFormats.includes(format)) {
      throw new HttpError(
        'Formato de arquivo para ser convertido inválido',
        400,
      );
    }

    const originalFileFormat = file.originalname.split('.').pop();

    if (originalFileFormat === format) {
      throw new HttpError('Arquivo com o mesmo formato de saída', 400);
    }

    const id = file.filename.split('.')[0];

    const fileObject = {
      id,
      originalName: file.originalname,
      storedName: file.filename,
      mimetype: file.mimetype,
      path: file.path,
      format,
      status: 'pending',
    };

    await this.taskRepository.create(fileObject);

    await convertQueue.add('convert', fileObject);
    return { id };
  }
}
