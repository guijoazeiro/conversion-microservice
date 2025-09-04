import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../../src/app';
import { ERRORS } from '../../src/utils/constants';

vi.mock('../../src/database/postgres', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock('../../src/config/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Convert API - Integração', () => {
  let testFilePath: string;
  let mockPool: any;

  beforeAll(async () => {
    const { pool } = await import('../../src/database/postgres');
    mockPool = pool;

    testFilePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    await fs.mkdir(path.dirname(testFilePath), { recursive: true });

    const fakeImageBuffer = Buffer.from('fake-image-content');
    await fs.writeFile(testFilePath, fakeImageBuffer);
  });

  afterAll(async () => {
    try {
      await fs.unlink(testFilePath);
      await fs.rmdir(path.dirname(testFilePath));
    } catch (error) {}
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {});

  describe('POST /api/convert', () => {
    it('deve converter arquivo com sucesso - fluxo completo', async () => {
      const mockTaskId = 'abc123-def456-ghi789';
      const mockTask = {
        id: mockTaskId,
        original_name: 'test-image.jpg',
        stored_name: 'stored-test-image.jpg',
        input_path: '/uploads/stored-test-image.jpg',
        mimetype: 'image/jpeg',
        format: 'png',
        file_size: 1024,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ create_conversion_task_with_outbox: mockTaskId }],
        })
        .mockResolvedValueOnce({
          rows: [mockTask],
        });

      const response = await request(app)
        .post('/api/convert')
        .attach('file', testFilePath)
        .field('format', 'png')
        .expect(201);

      expect(response.body).toEqual(mockTask);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('deve retornar erro 400 quando nenhum arquivo é enviado', async () => {
      const response = await request(app)
        .post('/api/convert')
        .field('format', 'png')
        .expect(400);

      expect(response.body).toEqual({
        error: ERRORS.FILE_REQUIRED,
      });

      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 para formato inválido', async () => {
      const response = await request(app)
        .post('/api/convert')
        .attach('file', testFilePath)
        .field('format', 'invalid-format')
        .expect(400);

      expect(response.body).toEqual({
        error: ERRORS.UNSUPPORTED_TARGET_FORMAT
      });

      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando formato de saída é igual ao de entrada', async () => {
      const response = await request(app)
        .post('/api/convert')
        .attach('file', testFilePath)
        .field('format', 'jpg')
        .expect(400);

      expect(response.body).toEqual({
        error: ERRORS.SAME_FORMAT
      });

      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 para tipo de mídia não suportado', async () => {
      const txtFilePath = path.join(__dirname, 'fixtures', 'test.txt');
      await fs.writeFile(txtFilePath, 'test content');

      try {
        const response = await request(app)
          .post('/api/convert')
          .attach('file', txtFilePath)
          .field('format', 'pdf')
          .expect(400);

        expect(response.body).toEqual({
          error: ERRORS.UNSUPPORTED_MEDIA_FORMAT
        });
      } finally {
        await fs.unlink(txtFilePath);
      }
    });

    it('deve retornar erro 500 quando há erro no banco de dados', async () => {
      mockPool.query.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const response = await request(app)
        .post('/api/convert')
        .attach('file', testFilePath)
        .field('format', 'png')
        .expect(500);

      expect(response.body).toEqual({
        error: ERRORS.INTERNAL_SERVER
      });

      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    describe('Validação de formatos por tipo de mídia', () => {
      it('deve aceitar formato válido para áudio', async () => {
        const audioFilePath = path.join(
          __dirname,
          'fixtures',
          'test-audio.mp3',
        );
        await fs.writeFile(audioFilePath, 'fake-audio-content');

        const mockTaskId = 'audio-task-id';
        const mockTask = {
          id: mockTaskId,
          original_name: 'test-audio.mp3',
          stored_name: 'stored-test-audio.mp3',
          input_path: '/uploads/stored-test-audio.mp3',
          mimetype: 'audio/mpeg',
          format: 'wav',
          file_size: 2048,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ create_conversion_task_with_outbox: mockTaskId }],
          })
          .mockResolvedValueOnce({
            rows: [mockTask],
          });

        try {
          const response = await request(app)
            .post('/api/convert')
            .attach('file', audioFilePath)
            .field('format', 'wav')
            .expect(201);

          expect(response.body).toEqual(mockTask);
        } finally {
          await fs.unlink(audioFilePath);
        }
      });
    });
  });
});
