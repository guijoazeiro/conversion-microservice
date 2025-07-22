import mongoose from 'mongoose';
import { MONGODB_URI } from '../config/enviroment';
import logger from '../config/logger';

export async function connectDB() {
  logger.info('Conectando ao MongoDB');

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    logger.info('Conectado ao MongoDB');
  } catch (error) {
    logger.error('Erro ao conectar ao MongoDB:', error);
  }
}
