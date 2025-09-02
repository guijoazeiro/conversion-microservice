import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileService } from '../../src/service/file/FileService';
import { HttpError } from '../../src/errors/HttpError';
import { existsSync } from 'fs';
import { TestConstants } from '../helpers/test-helpers';

const mockTaskRepository = {
  getTaskById: vi.fn(),
  getTaskFiles: vi.fn(),
};

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('FileService - Unit Tests', () => {
  let fileService: FileService;
  const mockExistsSync = vi.mocked(existsSync);

  beforeEach(() => {
    vi.clearAllMocks();
    fileService = new FileService(mockTaskRepository as any);
  });

  describe('getStatus', () => {
    it('should return the status of the file', async () => {
      const id = '123';
      const status = 'pending';
      mockTaskRepository.getTaskById.mockResolvedValue({ status });
      const result = await fileService.getStatus(id);
      expect(result).toEqual({ fileName: undefined, status });
    });

    it('should throw an error if the file is not found', async () => {
      const id = '123';
      mockTaskRepository.getTaskById.mockResolvedValue(null);
      await expect(fileService.getStatus(id)).rejects.toThrow(
        new HttpError(
          'Arquivo não encontrado',
          TestConstants.HTTP_CODES.NOT_FOUND,
        ),
      );
    });
  });
  describe('download', () => {
    it('should return the path of the file', async () => {
      const id = '123';
      const mockFile = {
        output_path: 'path/to/file',
        status: 'completed',
      };

      mockTaskRepository.getTaskById.mockResolvedValue(mockFile);
      mockExistsSync.mockReturnValue(true);

      const result = await fileService.download(id);

      expect(result).toEqual(mockFile.output_path);
    });

    it('should throw an error if the file is not found', async () => {
      const id = '123';

      mockTaskRepository.getTaskById.mockResolvedValue(null);

      await expect(fileService.download(id)).rejects.toThrow(
        new HttpError(
          'Arquivo não encontrado',
          TestConstants.HTTP_CODES.NOT_FOUND,
        ),
      );
    });

    it('should throw an error if the file is not completed', async () => {
      const id = '123';
      const mockFile = {
        output_path: 'path/to/file',
        status: 'pending',
      };

      mockTaskRepository.getTaskById.mockResolvedValue(mockFile);

      await expect(fileService.download(id)).rejects.toThrow(
        new HttpError(
          'Arquivo ainda não convertido',
          TestConstants.HTTP_CODES.BAD_REQUEST,
        ),
      );
    })

    it('should throw an error if the file does not exist', async () => {
      const id = '123';
      const mockFile = {
        output_path: 'path/to/file',
        status: 'completed',
      };
      
      mockTaskRepository.getTaskById.mockResolvedValue(mockFile);

      await expect(fileService.download(id)).rejects.toThrow(
        new HttpError(
          'Arquivo não encontrado',
          TestConstants.HTTP_CODES.BAD_REQUEST,
        ),
      );
    });
  });

  describe('getFiles', () => {
    it('should return the files of the user', async () => {
      const mockParams = { status: 'pending', format: 'png', page: 1, limit: 10  };

      const mockFiles = [
        {
          stored_name: 'file1.png',
          status: 'pending',
          created_at: new Date(),
        },
        {
          stored_name: 'file2.png',
          status: 'pending',
          created_at: new Date(),
        },
      ];
    
      mockTaskRepository.getTaskFiles.mockResolvedValue(mockFiles);

      const result = await fileService.getFiles(mockParams);
      
      expect(result).toEqual(mockFiles);
    });
  });
});
