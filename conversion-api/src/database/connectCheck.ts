import logger from '../config/logger';
import { pool } from './postgres';

export async function connectDB() {
  logger.info('Conectando ao banco de dados...');
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Banco de dados conectado com sucesso');
  } catch (error) {
    logger.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}
