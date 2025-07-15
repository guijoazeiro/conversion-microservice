import mongoose from 'mongoose';
import { MONGODB_URI } from '../config/enviroment';

export async function connectDB() {
  console.log('Conectando ao MongoDB');

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log('Conectado ao MongoDB');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
  }
}
