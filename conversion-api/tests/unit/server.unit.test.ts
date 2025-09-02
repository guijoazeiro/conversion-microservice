import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockListen = vi.fn();
const mockApp = {
  listen: mockListen,
};

vi.mock('../../src/app', () => ({
  default: mockApp,
}));

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

vi.mock('../../src/config/logger', () => ({
  default: mockLogger,
}));

const mockConnectDB = vi.fn();

vi.mock('../../src/database/connectCheck', () => ({
  connectDB: mockConnectDB,
}));

vi.mock('../../src/config/enviroment', () => ({
  PORT: 3000,
  PG_DATABASE: 'test_database',
  PG_HOST: 'localhost',
  PG_PORT: 5432,
  PG_USER: 'test_user',
  PG_PASSWORD: 'test_password',
  OUTPUT_DIR: '../tmp/output',
  uploadDir: '../tmp/input',
}));

describe('Server', () => {
  let originalProcessExit: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    originalProcessExit = process.exit;
    process.exit = vi.fn() as any;
  });

  afterEach(() => {
    process.exit = originalProcessExit;
    vi.clearAllTimers();
    vi.resetModules();
  });

  it('should start server successfully when database connects', async () => {
    mockConnectDB.mockResolvedValue(undefined);
    
    mockListen.mockImplementation((port: number, callback: () => void) => {
      callback();
      return { close: vi.fn() }; 
    });

    await import('../../src/server');
    
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockConnectDB).toHaveBeenCalledTimes(1);
    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(mockLogger.info).toHaveBeenCalledWith('Server running on http://localhost:3000');
    expect(mockLogger.info).toHaveBeenCalledWith('Swagger running on http://localhost:3000/api-docs');
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should log error when database connection fails', async () => {
    const dbError = new Error('Database connection failed');
    mockConnectDB.mockRejectedValue(dbError);

    await import('../../src/server');
    
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockConnectDB).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(dbError);
    expect(mockListen).not.toHaveBeenCalled();
  });

  it('should use correct PORT from environment', async () => {
    mockConnectDB.mockResolvedValue(undefined);
    mockListen.mockImplementation((port: number, callback: () => void) => {
      callback();
      return { close: vi.fn() };
    });

    await import('../../src/server');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  it('should handle app.listen callback correctly', async () => {
    mockConnectDB.mockResolvedValue(undefined);
    
    let listenCallback: (() => void) | undefined;
    mockListen.mockImplementation((port: number, callback: () => void) => {
      listenCallback = callback;
      return { close: vi.fn() };
    });

    await import('../../src/server');
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (listenCallback) {
      listenCallback();
    }

    expect(mockLogger.info).toHaveBeenCalledWith('Server running on http://localhost:3000');
    expect(mockLogger.info).toHaveBeenCalledWith('Swagger running on http://localhost:3000/api-docs');
  });

  it('should handle server startup errors gracefully', async () => {
    mockConnectDB.mockResolvedValue(undefined);
    const listenError = new Error('Port already in use');
    
    mockListen.mockImplementation((port: number, callback: () => void) => {
      throw listenError;
    });

    await import('../../src/server');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockConnectDB).toHaveBeenCalledTimes(1);
    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
  });
});