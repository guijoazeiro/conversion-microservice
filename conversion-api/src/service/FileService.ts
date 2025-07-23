import path, { join } from 'path';
import { TaskRepository } from '../repositories/TaskRepository';
import { OUTPUT_DIR } from '../config/enviroment';
import { existsSync } from 'fs';
import { HttpError } from '../errors/HttpError';

const outputDirectory = path.resolve(process.cwd(), OUTPUT_DIR);

export class FileService {
  constructor(private taskRepository = new TaskRepository()) {
    this.taskRepository = taskRepository;
  }

  async getStatus(id: string): Promise<{ status: string }> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new HttpError('Arquivo nao encontrado', 404);
    }
    return { status: task.status };
  }

  async download(id: string) {
    const file = await this.taskRepository.findById(id);
    if (!file) {
      throw new HttpError('Arquivo não encontrado', 404);
    }
    if (file.status !== 'done') {
      throw new HttpError('Arquivo ainda não convertido', 400);
    }

    if (!file.outputPath || !existsSync(file.outputPath)) {
      throw new HttpError('Arquivo não encontrado', 404);
    }

    return file.outputPath;
  }
}
