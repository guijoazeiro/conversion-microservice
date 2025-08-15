import http from 'http';
import app from './app';
import { PORT } from './config/enviroment';
import { connectDB } from './database/connection';
import logger from './config/logger';

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Swagger running on http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error(error);
  }
}

startServer();
