import { TaskRepository } from '../repositories/TaskRepository';

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
}
