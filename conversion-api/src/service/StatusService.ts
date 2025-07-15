import path, { join } from 'path';
import { TaskRepository } from '../repositories/TaskRepository';
import { OUTPUT_DIR } from '../config/enviroment';
import { existsSync } from 'fs';

const outputDirectory = path.resolve(process.cwd(), OUTPUT_DIR);

export class StatusService {
  constructor(private taskRepository = new TaskRepository()) {
    this.taskRepository = taskRepository;
  }

  async getStatus(id: string): Promise<{ status: string }> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error('Tarefa não encontrada');
    }
    return { status: task.status };
  }

  async download(id: string) {
    const file = join(outputDirectory, `${id}.mp3`);
    if (!existsSync(file)) {
      throw new Error('Arquivo não encontrado');
    }
    return file;
  }
}
