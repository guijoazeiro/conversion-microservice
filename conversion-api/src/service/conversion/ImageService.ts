import { convertQueue } from '../../jobs/convert.queue';
import { TaskRepository } from '../../repositories/TaskRepository';

export class ImageService {
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
    const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedFormats.includes(format)) {
      throw new Error('Formato de arquivo inválido');
    }

    const originalFileFormat = file.originalname.split('.').pop();

    if (originalFileFormat === format) {
      throw new Error('Arquivo com o mesmo formato');
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
