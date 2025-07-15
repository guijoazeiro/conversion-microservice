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

  async process(file: Express.Multer.File) {
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
    });

    return { id };
  }
}
