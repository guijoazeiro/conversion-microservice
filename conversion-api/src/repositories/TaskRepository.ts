import logger from '../config/logger';
import { pool } from '../database/postgres';
import { buildWhereClause } from '../utils/sqlHelper';

interface GetFilesParams {
  query: Record<string, any>;
  skip: number;
  limit: number;
  page: number;
}

interface PaginationResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export class TaskRepository {
  async createConversion(conversionData: {
    inputPath: string;
    mimetype: string;
    format: string;
    fileSize: number;
    originalName: string;
    storedName: string;
    status: string;
  }) {
    try {
      const result = await pool.query(
        `SELECT create_conversion_task_with_outbox($1, $2, $3, $4, $5, $6, $7)`,
        [
          conversionData.originalName,
          conversionData.storedName,
          conversionData.inputPath,
          conversionData.mimetype,
          conversionData.format,
          conversionData.fileSize,
          null,
        ],
      );

      const taskId = result.rows[0].create_conversion_task_with_outbox;

      const taskResult = await pool.query(
        `SELECT id, original_name, stored_name, input_path, mimetype, format, file_size, status, created_at, updated_at FROM conversion_tasks WHERE id = $1`,
        [taskId],
      );

      return taskResult.rows[0];
    } catch (error) {
      logger.error('Erro ao criar conversão:', error);
      throw error;
    }
  }

  async getTaskById(id: string) {
    try {
      const result = await pool.query(
        `SELECT * FROM conversion_tasks WHERE id = $1`,
        [id],
      );
      return result.rows[0];
    } catch (error) {
      logger.error(error);
    }
  }
  async getTaskFiles(params: GetFilesParams): Promise<PaginationResult> {
    const { query, skip, limit, page } = params;

    const { whereClause, values } = buildWhereClause(query);

    const dataQuery = `
      SELECT * FROM conversion_tasks 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM conversion_tasks 
      ${whereClause}
    `;

    try {
      const [dataResult, countResult] = await Promise.all([
        pool.query(dataQuery, [...values, limit, skip]),
        pool.query(countQuery, values),
      ]);

      const files = dataResult.rows;
      const total = parseInt(countResult.rows[0].total, 10);

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
    } catch (error) {
      throw new Error(`Erro ao buscar arquivos`);
    }
  }
}
