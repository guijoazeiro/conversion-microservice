import { Task } from '../database/models/Task';

export class TaskRepository {
  async create(data: unknown) {
    return await Task.create(data);
  }
  async updateStatus(id: string, status: string) {
    return Task.findOneAndUpdate({ id }, { status }, { new: true });
  }

  async findById(id: string) {
    return Task.findOne({ id });
  }
}
