import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversionService } from '../../src/service/conversion/ConversionService';
import { HttpError } from '../../src/errors/HttpError';
import { TestDataFactory, TestConstants } from '../helpers/test-helpers';

const mockTaskRepository = {
  createConversion: vi.fn(),
};

vi.mock('../../src/errors/HttpError');

describe('ConversionService - Unit Tests', () => {
  let conversionService: ConversionService;

  beforeEach(() => {
    vi.clearAllMocks();
    conversionService = new ConversionService(mockTaskRepository as any);
  });

  describe('process - Logic', () => {
    it('should extract media type correctly and build conversion data', async () => {
      const mockFile = TestDataFactory.createMockMulterFile({
        mimetype: 'image/jpeg',
        originalname: 'user-photo.jpg',
        path: '/uploads/stored-123.jpg',
        size: 2048,
        filename: 'stored-123.jpg',
      });

      const format = 'png';

      mockTaskRepository.createConversion.mockResolvedValueOnce({
        id: 'any-id',
      });

      await conversionService.process({ file: mockFile, format });

      expect(mockTaskRepository.createConversion).toHaveBeenCalledWith({
        inputPath: '/uploads/stored-123.jpg',
        mimetype: 'image/jpeg',
        format: 'png',
        fileSize: 2048,
        originalName: 'user-photo.jpg',
        storedName: 'stored-123.jpg',
        status: TestConstants.STATUS.PENDING,
      });
    });

    it('should reject unsupported media types based on mimetype parsing', async () => {
      const mockFile = TestDataFactory.createMockMulterFile({
        mimetype: 'application/pdf',
      });

      await expect(
        conversionService.process({ file: mockFile, format: 'jpg' }),
      ).rejects.toThrow(HttpError);

      expect(mockTaskRepository.createConversion).not.toHaveBeenCalled();
    });

    it('should reject invalid formats for valid media types', async () => {
      const mockFile = TestDataFactory.createMockMulterFile({
        mimetype: TestConstants.MEDIA_TYPES.IMAGE_JPEG,
      });

      await expect(
        conversionService.process({ file: mockFile, format: 'invalid-format' }),
      ).rejects.toThrow(HttpError);

      expect(mockTaskRepository.createConversion).not.toHaveBeenCalled();
    });

    it('should extract file extension correctly for comparison', async () => {
      const testCases = [
        {
          originalname: 'photo.jpg',
          format: 'jpg',
          shouldFail: true,
          description: 'same extension',
        },
        {
          originalname: 'photo.jpeg',
          format: 'jpg',
          shouldFail: false,
          description: 'different but related extensions',
        },
        {
          originalname: 'complex.file.name.png',
          format: 'png',
          shouldFail: true,
          description: 'multiple dots - should get last extension',
        },
        {
          originalname: 'no-extension',
          format: 'jpg',
          shouldFail: false,
          description: 'no extension - should proceed',
        },
      ];

      for (const testCase of testCases) {
        mockTaskRepository.createConversion.mockClear();

        const mockFile = TestDataFactory.createMockMulterFile({
          mimetype: TestConstants.MEDIA_TYPES.IMAGE_JPEG,
          originalname: testCase.originalname,
        });

        if (testCase.shouldFail) {
          await expect(
            conversionService.process({
              file: mockFile,
              format: testCase.format,
            }),
          ).rejects.toThrow(HttpError);

          expect(mockTaskRepository.createConversion).not.toHaveBeenCalled();
        } else {
          mockTaskRepository.createConversion.mockResolvedValueOnce({
            id: 'test',
          });

          await conversionService.process({
            file: mockFile,
            format: testCase.format,
          });

          expect(mockTaskRepository.createConversion).toHaveBeenCalledTimes(1);
        }
      }
    });
  });

  describe('process - Error Handling', () => {
    it('should handle repository returning null', async () => {
      const mockFile = TestDataFactory.createMockMulterFile({
        mimetype: TestConstants.MEDIA_TYPES.IMAGE_JPEG,
        originalname: 'test.jpg',
      });

      mockTaskRepository.createConversion.mockResolvedValueOnce(null);

      await expect(
        conversionService.process({ file: mockFile, format: 'png' }),
      ).rejects.toThrow(HttpError);

      expect(mockTaskRepository.createConversion).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors without modification', async () => {
      const mockFile = TestDataFactory.createMockMulterFile({
        mimetype: TestConstants.MEDIA_TYPES.IMAGE_JPEG,
        originalname: 'test.jpg',
      });

      const originalError = new Error('Database connection failed');
      mockTaskRepository.createConversion.mockRejectedValueOnce(originalError);

      await expect(
        conversionService.process({ file: mockFile, format: 'png' }),
      ).rejects.toThrow(originalError);
    });
  });

  describe('process - Media Type Validation', () => {
    it('should validate format compatibility per media type correctly', async () => {
      const validationMatrix = [
        {
          mimetype: TestConstants.MEDIA_TYPES.IMAGE_JPEG,
          format: 'png',
          shouldPass: true,
          description: 'image to image',
        },
        {
          mimetype: TestConstants.MEDIA_TYPES.IMAGE_JPEG,
          format: 'mp3',
          shouldPass: false,
          description: 'image to audio - should fail',
        },
        {
          mimetype: TestConstants.MEDIA_TYPES.AUDIO_MP3,
          format: 'wav',
          shouldPass: true,
          description: 'audio to audio',
        },
        {
          mimetype: TestConstants.MEDIA_TYPES.AUDIO_MP3,
          format: 'jpg',
          shouldPass: false,
          description: 'audio to image - should fail',
        },
        {
          mimetype: TestConstants.MEDIA_TYPES.VIDEO_MP4,
          format: 'avi',
          shouldPass: true,
          description: 'video to video',
        },
        {
          mimetype: TestConstants.MEDIA_TYPES.VIDEO_MP4,
          format: 'mp3',
          shouldPass: true,
          description: 'video to audio - should pass if supported',
        },
      ];

      for (const test of validationMatrix) {
        mockTaskRepository.createConversion.mockClear();

        const mockFile = TestDataFactory.createMockMulterFile({
          mimetype: test.mimetype,
          originalname: `test.${test.shouldPass ? 'different' : 'ext'}`,
        });

        if (test.shouldPass) {
          mockTaskRepository.createConversion.mockResolvedValueOnce({
            id: 'test',
          });

          await conversionService.process({
            file: mockFile,
            format: test.format,
          });

          expect(mockTaskRepository.createConversion).toHaveBeenCalled();
        } else {
          await expect(
            conversionService.process({ file: mockFile, format: test.format }),
          ).rejects.toThrow(HttpError);

          expect(mockTaskRepository.createConversion).not.toHaveBeenCalled();
        }
      }
    });

    it('should handle edge cases in file naming', async () => {
      const edgeCases = [
        {
          originalname: 'file.with.multiple.dots.jpg',
          format: 'png',
          description: 'multiple dots in filename',
        },
        {
          originalname: 'FILE.JPG',
          format: 'jpg',
          description: 'uppercase extension comparison',
        },
        {
          originalname: 'arquivo com espaços.jpg',
          format: 'png',
          description: 'filename with spaces',
        },
        {
          originalname: 'file-name@#$%.jpg',
          format: 'png',
          description: 'special characters in filename',
        },
      ];

      for (const testCase of edgeCases) {
        mockTaskRepository.createConversion.mockClear();
        mockTaskRepository.createConversion.mockResolvedValueOnce({
          id: 'test',
        });

        const mockFile = TestDataFactory.createMockMulterFile({
          mimetype: TestConstants.MEDIA_TYPES.IMAGE_JPEG,
          originalname: testCase.originalname,
        });

        await conversionService.process({
          file: mockFile,
          format: testCase.format,
        });

        expect(mockTaskRepository.createConversion).toHaveBeenCalledWith(
          expect.objectContaining({
            originalName: testCase.originalname,
            format: testCase.format,
          }),
        );
      }
    });
  });

  describe('process - Business Logic Integration', () => {
    it('should follow complete validation flow', async () => {
      const mockFile = TestDataFactory.createMockMulterFile({
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
        path: '/uploads/photo-123.jpg',
        size: 5120,
        filename: 'photo-123.jpg',
      });

      mockTaskRepository.createConversion.mockResolvedValueOnce({
        id: 'task-456',
        status: 'pending',
      });

      const result = await conversionService.process({
        file: mockFile,
        format: 'png',
      });

      expect(result).toEqual({ id: 'task-456', status: 'pending' });

      expect(mockTaskRepository.createConversion).toHaveBeenCalledWith({
        inputPath: '/uploads/photo-123.jpg',
        mimetype: 'image/jpeg',
        format: 'png',
        fileSize: 5120,
        originalName: 'photo.jpg',
        storedName: 'photo-123.jpg',
        status: TestConstants.STATUS.PENDING,
      });
    });
  });
});
