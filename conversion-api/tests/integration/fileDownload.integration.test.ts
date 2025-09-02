import supertest from 'supertest';
import {
  beforeAll,
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterAll,
} from 'vitest';
import app from '../../src/app';
import { writeFile, mkdir, unlink, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

vi.mock('../../src/database/postgres', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

describe('FileDownload - Integration Tests', () => {
  let mockPool: any;
  let testOutputDir: string;

  beforeAll(async () => {
    const { pool } = await import('../../src/database/postgres');
    mockPool = pool;

    testOutputDir = path.join(__dirname, 'fixtures', 'tmp', 'output');
    await mkdir(testOutputDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await rmdir(path.join(__dirname, 'fixtures', 'tmp'), { recursive: true });
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should download file when it exists and is completed', async () => {
    const testId = 'db30a770-df4f-4a30-90d4-c13db92c3c34';
    const testFilePath = path.join(testOutputDir, `${testId}.mkv`);

    const mockFileContent = Buffer.from('fake MKV video content for testing');
    await writeFile(testFilePath, mockFileContent);

    const mockTask = {
      id: testId,
      original_name: 'SampleVideo_1280x720_1mb.mp4',
      stored_name: 'b846851b-c948-4d7e-bb21-ed5e70021ac0.mp4',
      input_path: '/tmp/input/b846851b-c948-4d7e-bb21-ed5e70021ac0.mp4',
      mimetype: 'video/mp4',
      format: 'mkv',
      file_size: '1055736',
      status: 'completed',
      created_at: '2025-08-22T15:14:54.444Z',
      updated_at: '2025-08-22T15:15:05.891Z',
      error_message: null,
      processing_started_at: null,
      processing_completed_at: null,
      output_path: testFilePath,
      output_size: null,
    };

    mockPool.query.mockResolvedValue({
      rows: [mockTask],
    });

    const response = await supertest(app)
      .get(`/api/file/download/${testId}`)
      .expect(200)
      .expect('Content-Disposition', /attachment/);

    expect(response.body).toEqual(mockFileContent);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [testId],
    );

    await unlink(testFilePath);
  });

  it('should return 404 when task is not found', async () => {
    mockPool.query.mockResolvedValue({
      rows: [],
    });

    const response = await supertest(app)
      .get('/api/file/download/nonexistent-id')
      .expect(404);

    expect(response.body).toEqual({
      error: 'Arquivo não encontrado',
    });
  });

  it('should return 400 when task is not completed', async () => {
    const mockTask = {
      id: 'abc123-def456-ghi789',
      status: 'processing',
      output_path: '/fake/path/to/file.pdf',
    };

    mockPool.query.mockResolvedValue({
      rows: [mockTask],
    });

    const response = await supertest(app)
      .get('/api/file/download/abc123-def456-ghi789')
      .expect(400);

    expect(response.body).toEqual({
      error: 'Arquivo ainda não convertido',
    });
  });

  it('should return 400 when task has no output_path', async () => {
    const mockTask = {
      id: 'abc123-def456-ghi789',
      status: 'completed',
      output_path: null,
    };

    mockPool.query.mockResolvedValue({
      rows: [mockTask],
    });

    const response = await supertest(app)
      .get('/api/file/download/abc123-def456-ghi789')
      .expect(400);

    expect(response.body).toEqual({
      error: 'Arquivo não encontrado',
    });
  });

  it('should return 400 when task is not completed', async () => {
    const mockTask = {
      id: 'abc123-def456-ghi789',
      status: 'processing',
      output_path: '/fake/path/to/file.pdf',
    };

    mockPool.query.mockResolvedValue({
      rows: [mockTask],
    });

    const response = await supertest(app)
      .get('/api/file/download/abc123-def456-ghi789')
      .expect(400);

    expect(response.body).toEqual({
      error: 'Arquivo ainda não convertido',
    });
  });

  it('should return 500 when database query fails', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await supertest(app)
      .get('/api/file/download/abc123-def456-ghi789')
      .expect(500);

    expect(response.body).toEqual({
      error: 'Erro ao baixar arquivo',
    });
  })
});
