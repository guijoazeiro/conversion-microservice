import logger from '../config/logger';
import { pool } from './postgres';

export async function connectDB() {
  logger.info('Connecting to database...');
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Error connecting to database:', error);
    throw error;
  }
}
