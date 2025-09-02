import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskRepository } from '../../src/repositories/TaskRepository';
import { TestDataFactory } from '../helpers/test-helpers';
import logger from '../../src/config/logger';
import { pool } from '../../src/database/postgres';

vi.mock('../../src/config/logger');
vi.mock('../../src/database/postgres');

describe('TaskRepository - Unit Tests', () => {
  let taskRepository: TaskRepository;
  let mockPool: any;
  let mockLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPool = vi.mocked(pool);
    mockLogger = vi.mocked(logger);

    taskRepository = new TaskRepository();
  });

  describe('createConversion', () => {
    it('should create conversion task successfully', async () => {
      const conversionData = TestDataFactory.createMockConversionData();
      const taskId = 'generated-uuid-123';
      const expectedTask = TestDataFactory.createMockTask({ id: taskId });

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ create_conversion_task_with_outbox: taskId }],
        } as any)
        .mockResolvedValueOnce({
          rows: [expectedTask],
        } as any);

      const result = await taskRepository.createConversion(conversionData);

      expect(result).toEqual(expectedTask);
      expect(mockPool.query).toHaveBeenCalledTimes(2);

      expect(mockPool.query).toHaveBeenNthCalledWith(
        1,
        'SELECT create_conversion_task_with_outbox($1, $2, $3, $4, $5, $6, $7)',
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

      expect(mockPool.query).toHaveBeenNthCalledWith(
        2,
        'SELECT id, original_name, stored_name, input_path, mimetype, format, file_size, status, created_at, updated_at FROM conversion_tasks WHERE id = $1',
        [taskId],
      );
    });

    it('should handle database error during task creation', async () => {
      const conversionData = TestDataFactory.createMockConversionData();
      const dbError = new Error('Database connection failed');

      mockPool.query.mockRejectedValueOnce(dbError);

      await expect(
        taskRepository.createConversion(conversionData),
      ).rejects.toThrow('Database connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao criar conversão:',
        dbError,
      );
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should handle error during task fetch after creation', async () => {
      const conversionData = TestDataFactory.createMockConversionData();
      const taskId = 'test-uuid';
      const fetchError = new Error('Task fetch failed');

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ create_conversion_task_with_outbox: taskId }],
        } as any)
        .mockRejectedValueOnce(fetchError);

      await expect(
        taskRepository.createConversion(conversionData),
      ).rejects.toThrow('Task fetch failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao criar conversão:',
        fetchError,
      );
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error if create_conversion_task_with_outbox returns null', async () => {
      const conversionData = TestDataFactory.createMockConversionData();


      mockPool.query.mockResolvedValueOnce({
        rows: [{ create_conversion_task_with_outbox: null }],
      } as any);

      await expect(
        taskRepository.createConversion(conversionData),
      ).rejects.toThrow();
    });

    it('should handle various data types correctly', async () => {
      const testCases = [
        {
          data: TestDataFactory.createMockConversionData({
            originalName: 'file with spaces.jpg',
            fileSize: 0,
          }),
          description: 'file with spaces and zero size',
        },
        {
          data: TestDataFactory.createMockConversionData({
            originalName: 'arquivo-acentuação.mp3',
            fileSize: 999999999,
            mimetype: 'audio/mpeg',
          }),
          description: 'large file with special characters',
        },
      ];

      for (const testCase of testCases) {
        mockPool.query.mockClear();

        const taskId = 'test-id';
        const expectedTask = TestDataFactory.createMockTask({ id: taskId });

        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ create_conversion_task_with_outbox: taskId }],
          } as any)
          .mockResolvedValueOnce({
            rows: [expectedTask],
          } as any);

        await taskRepository.createConversion(testCase.data);

        expect(mockPool.query).toHaveBeenNthCalledWith(1, expect.any(String), [
          testCase.data.originalName,
          testCase.data.storedName,
          testCase.data.inputPath,
          testCase.data.mimetype,
          testCase.data.format,
          testCase.data.fileSize,
          null,
        ]);
      }
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      const taskId = 'existing-task-id';
      const expectedTask = TestDataFactory.createMockTask({ id: taskId });

      mockPool.query.mockResolvedValueOnce({
        rows: [expectedTask],
      } as any);

      const result = await taskRepository.getTaskById(taskId);

      expect(result).toEqual(expectedTask);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM conversion_tasks WHERE id = $1',
        [taskId],
      );
    });

    it('should return undefined when task not found', async () => {
      const taskId = 'non-existent-id';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
      } as any);

      const result = await taskRepository.getTaskById(taskId);

      expect(result).toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM conversion_tasks WHERE id = $1',
        [taskId],
      );
    });

    it('should handle database errors', async () => {
      const taskId = 'test-id';
      const dbError = new Error('Database error');

      mockPool.query.mockRejectedValueOnce(dbError);

      await expect(taskRepository.getTaskById(taskId)).rejects.toThrow(
        'Erro ao buscar arquivo',
      );
    });

    it('should handle different ID formats', async () => {
      const testIds = [
        'uuid-format-123e4567-e89b-12d3-a456-426614174000',
        'short-123',
        '12345',
        'special-chars@#$%',
        '',
      ];

      for (const testId of testIds) {
        mockPool.query.mockClear();
        mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

        await taskRepository.getTaskById(testId);

        expect(mockPool.query).toHaveBeenCalledWith(
          'SELECT * FROM conversion_tasks WHERE id = $1',
          [testId],
        );
      }
    });
  });

  describe('getTaskFiles', () => {
    it('should return paginated results successfully', async () => {
      const params = {
        query: { status: 'pending' },
        skip: 0,
        limit: 10,
        page: 1,
      };

      const mockTasks = [
        TestDataFactory.createMockTask({ id: '1' }),
        TestDataFactory.createMockTask({ id: '2' }),
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockTasks } as any)
        .mockResolvedValueOnce({ rows: [{ total: '20' }] } as any);

      const result = await taskRepository.getTaskFiles(params);

      expect(result.data).toEqual(mockTasks);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 20,
        totalPages: 2,
        hasNextPage: true,
      });

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should handle empty results', async () => {
      const params = {
        query: {},
        skip: 0,
        limit: 10,
        page: 1,
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);

      const result = await taskRepository.getTaskFiles(params);

      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it('should handle database errors', async () => {
      const params = {
        query: {},
        skip: 0,
        limit: 10,
        page: 1,
      };

      const dbError = new Error('Database connection failed');
      mockPool.query.mockRejectedValueOnce(dbError);

      await expect(taskRepository.getTaskFiles(params)).rejects.toThrow(
        'Erro ao buscar arquivos',
      );
    });

    it('should calculate pagination correctly', async () => {
      const testCases = [
        {
          total: 25,
          limit: 10,
          page: 1,
          expectedPages: 3,
          expectedHasNext: true,
        },
        {
          total: 10,
          limit: 10,
          page: 1,
          expectedPages: 1,
          expectedHasNext: false,
        },
        {
          total: 15,
          limit: 5,
          page: 3,
          expectedPages: 3,
          expectedHasNext: false,
        },
      ];

      for (const testCase of testCases) {
        mockPool.query.mockClear();
        mockPool.query
          .mockResolvedValueOnce({ rows: [] } as any)
          .mockResolvedValueOnce({
            rows: [{ total: testCase.total.toString() }],
          } as any);

        const params = {
          query: {},
          skip: (testCase.page - 1) * testCase.limit,
          limit: testCase.limit,
          page: testCase.page,
        };

        const result = await taskRepository.getTaskFiles(params);

        expect(result.pagination.totalPages).toBe(testCase.expectedPages);
        expect(result.pagination.hasNextPage).toBe(testCase.expectedHasNext);
      }
    });
  });
});
