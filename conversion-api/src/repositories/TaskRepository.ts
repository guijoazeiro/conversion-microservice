import { Task } from '../database/models/Task';

export class TaskRepository {
  async create(data: unknown) {
    return await Task.create(data);
  }
  async updateStatus(id: string, status: string) {
    return Task.findOneAndUpdate({ id }, { status }, { new: true });
  }

  async findById(id: string) {
    return Task.findOne({ _id: id });
  }

  async getFiles(params: {
    query: any;
    skip: number;
    limit: number;
    page: number;
  }) {
    const { query, skip, limit, page } = params;

    const [files, total] = await Promise.all([
      Task.find(query).skip(skip).limit(limit),
      Task.countDocuments(query),
    ]);

    return {
      data: files,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }
}
