import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectDB } from '../../src/database/connectCheck';

vi.mock('../../src/config/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/database/postgres', () => ({
  pool: {
    connect: vi.fn(),
  },
}));

describe('connectDB', () => {
  let mockLogger: any;
  let mockPool: any;
  let mockClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockLogger = (await import('../../src/config/logger')).default;
    mockPool = (await import('../../src/database/postgres')).pool;
    
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
  });

  it('should connect successfully and log success message', async () => {
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    await connectDB();

    expect(mockLogger.info).toHaveBeenCalledWith('Connecting to database...');
    expect(mockPool.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith('Database connected successfully');
  });

  it('should throw error and log error message when connection fails', async () => {
    const connectionError = new Error('Connection refused');
    mockPool.connect.mockRejectedValue(connectionError);

    await expect(connectDB()).rejects.toThrow('Connection refused');
    
    expect(mockLogger.info).toHaveBeenCalledWith('Connecting to database...');
    expect(mockLogger.error).toHaveBeenCalledWith('Error connecting to database:', connectionError);
    expect(mockClient.release).not.toHaveBeenCalled();
  });

  it('should throw error and log error when query fails', async () => {
    const queryError = new Error('Query failed');
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockRejectedValue(queryError);

    await expect(connectDB()).rejects.toThrow('Query failed');
    
    expect(mockLogger.info).toHaveBeenCalledWith('Connecting to database...');
    expect(mockPool.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
    expect(mockClient.release).toHaveBeenCalledTimes(0);
    expect(mockLogger.error).toHaveBeenCalledWith('Error connecting to database:', queryError);
  });

  it('should handle client release error gracefully', async () => {
    const releaseError = new Error('Release failed');
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
    mockClient.release.mockImplementation(() => {
      throw releaseError;
    });

    await expect(connectDB()).rejects.toThrow();
    
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});