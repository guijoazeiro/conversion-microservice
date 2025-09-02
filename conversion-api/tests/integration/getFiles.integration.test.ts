import supertest from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import app from '../../src/app';
import { before } from 'node:test';

vi.mock('../../src/database/postgres', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

describe('GetFiles - Integration Tests', () => {
  let mockPool: any;

  beforeAll(async () => {
    const { pool } = await import('../../src/database/postgres');
    mockPool = pool;
  });

  it('should return the list of files with params', async () => {
    const mockFiles = [
      {
        id: 'abc123-def456-ghi789',
        filename: 'test.png',
        status: 'pending',
        format: 'png',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      {
        id: 'abc123-def456-ghi789',
        filename: 'test.png',
        status: 'pending',
        format: 'png',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    ];

    const mockResult = {
      data: [mockFiles],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
      },
    };

    mockPool.query
      .mockResolvedValueOnce({
        rows: [mockFiles],
      })
      .mockResolvedValueOnce({
        rows: [{ total: 2 }],
      });

    const response = await supertest(app).get('/api/file').query({
      status: 'pending',
      format: 'png',
      page: 1,
      limit: 10,
    }).expect(200);
    
    expect(response.body).toEqual(mockResult);
  });


  it('should return the list of files without params', async () => {
    const mockFiles = [
      {
        id: 'abc123-def456-ghi789',
        filename: 'test.png',
        status: 'pending',
        format: 'png',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      {
        id: 'abc123-def456-ghi789',
        filename: 'test.png',
        status: 'pending',
        format: 'png',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    ];

    const mockResult = {
      data: [mockFiles],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
      },
    };

    mockPool.query
      .mockResolvedValueOnce({
        rows: [mockFiles],
      })
      .mockResolvedValueOnce({
        rows: [{ total: 2 }],
      });

    const response = await supertest(app).get('/api/file').expect(200);

    expect(response.body).toEqual(mockResult);
  });

  it('should return 500 when database query fails', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await supertest(app).get('/api/file').expect(500);

    expect(response.body).toEqual({
      error: 'Erro ao buscar arquivos',
    });
  });
});
