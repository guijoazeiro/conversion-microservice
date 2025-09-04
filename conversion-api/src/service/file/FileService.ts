import { TaskRepository } from '../../repositories/TaskRepository';
import { existsSync } from 'fs';
import { HttpError } from '../../errors/HttpError';
import { BAD_REQUEST_CODE, ERRORS, NOT_FOUND_CODE } from '../../utils/constants';

export class FileService {
  constructor(private taskRepository = new TaskRepository()) {
    this.taskRepository = taskRepository;
  }

  async getStatus(id: string): Promise<{
    fileName: string | undefined;
    status: 'pending' | 'processing' | 'done' | 'failed';
  }> {
    const task = await this.taskRepository.getTaskById(id);
    if (!task) {
      throw new HttpError(ERRORS.FILE_NOT_FOUND, NOT_FOUND_CODE);
    }
    return { fileName: task.stored_name, status: task.status };
  }

  async download(id: string): Promise<string> {
    const file = await this.taskRepository.getTaskById(id);
    if (!file) {
      throw new HttpError(ERRORS.FILE_NOT_FOUND, NOT_FOUND_CODE);
    }
    if (file.status !== 'completed') {
      throw new HttpError(ERRORS.FILE_NOT_COMPLETED, BAD_REQUEST_CODE);
    }

    if (!file.output_path || !existsSync(file.output_path)) {
      throw new HttpError(ERRORS.OUTPUT_FILE_NOT_FOUND, BAD_REQUEST_CODE);
    }

    return file.output_path;
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

    return await this.taskRepository.getTaskFiles({
      query,
      skip,
      limit,
      page: Number(page),
    });
  }
}
