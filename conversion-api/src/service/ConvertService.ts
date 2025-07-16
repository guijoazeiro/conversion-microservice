import { convertQueue } from '../jobs/convert.queue';
import { TaskRepository } from '../repositories/TaskRepository';

type Task = {
  id: string;
  originalName: string;
  storedName: string;
  mimetype: string;
  path: string;
};

export class ConvertService {
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
      throw new Error('Formato de arquivo inválido');
    }

    const originalFileFormat = file.originalname.split('.').pop();

    if(originalFileFormat === format) {
      throw new Error("Arquivo com o mesmo formato");
    }

    const id = file.filename.split('.')[0];

    await this.taskRepository.create({
      id,
      originalName: file.originalname,
      storedName: file.filename,
      mimetype: file.mimetype,
      path: file.path,
      status: 'pending',
    });

    await convertQueue.add('convert', {
      id,
      path: file.path,
      mimetype: file.mimetype,
      format,
    });

    return { id };
  }
}
