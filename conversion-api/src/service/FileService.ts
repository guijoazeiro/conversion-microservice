import { TaskRepository } from '../repositories/TaskRepository';
import { existsSync } from 'fs';
import { HttpError } from '../errors/HttpError';
import { BAD_REQUEST_CODE, NOT_FOUND_CODE } from '../utils/constants';

export class FileService {
  constructor(private taskRepository = new TaskRepository()) {
    this.taskRepository = taskRepository;
  }

  async getStatus(id: string): Promise<{ status: string }> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new HttpError('Arquivo não encontrado', NOT_FOUND_CODE);
    }
    return { status: task.status };
  }

  async download(id: string) {
    const file = await this.taskRepository.findById(id);
    if (!file) {
      throw new HttpError('Arquivo não encontrado', NOT_FOUND_CODE);
    }
    if (file.status !== 'done') {
      throw new HttpError('Arquivo ainda não convertido', BAD_REQUEST_CODE);
    }

    if (!file.outputPath || !existsSync(file.outputPath)) {
      throw new HttpError('Arquivo não encontrado', BAD_REQUEST_CODE);
    }

    return file.outputPath;
  }

  async getFiles(params: {
    status?: string;
    format?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, format, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    if (format) query.format = format;

    return await this.taskRepository.getFiles({
      query,
      skip,
      limit,
      page: Number(page),
    });
  }
}
