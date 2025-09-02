import supertest from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import app from '../../src/app';

vi.mock('../../src/database/postgres', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

describe('FileStatus - Integration Tests', () => {
  let mockPool: any;

  beforeAll(async () => {
    const { pool } = await import('../../src/database/postgres');
    mockPool = pool;
  });

  it('should return the status of the file', async () => {
    const mockFileStatus = {
      status: 'pending',
    };

    mockPool.query.mockResolvedValue({
      rows: [mockFileStatus],
    });

    const response = await supertest(app)
      .get('/api/file/status/abc123-def456-ghi789')
      .expect(200);

    expect(response.body).toEqual(mockFileStatus);
  });

  it('should return 404 if the file is not found', async () => {
    mockPool.query.mockResolvedValue({
      rows: [],
    });

    const response = await supertest(app)
      .get('/api/file/status/abc123-def456-ghi789')
      .expect(404);

    expect(response.body).toEqual({ error: 'Arquivo não encontrado' });
  });

  it('should return 500 if the database connection fails', async () => {
    mockPool.query.mockRejectedValueOnce(
      new Error('Database connection failed'),
    );

    const response = await supertest(app)
      .get('/api/file/status/abc123-def456-ghi789')
      .expect(500);

    expect(response.body).toEqual({
      error: 'Erro ao verificar status',
    });
  });
});
