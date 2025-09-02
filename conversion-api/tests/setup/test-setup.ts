import { beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

beforeAll(async () => {
  process.env.TZ = 'UTC';
  
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.PG_HOST = process.env.PG_HOST || 'localhost';
  process.env.PG_PORT = process.env.PG_PORT || '5432';
  process.env.PG_USER = process.env.PG_USER || 'test_user';
  process.env.PG_PASSWORD = process.env.PG_PASSWORD || 'test_password';
  process.env.PG_DATABASE = process.env.PG_DATABASE || 'test_db';
  
  if (process.env.SILENCE_LOGS === 'true') {
    vi.stubGlobal('console', {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    });
  }
});

afterAll(async () => {
});

vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});