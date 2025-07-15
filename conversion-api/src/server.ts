import http from 'http';
import app from './app';
import { PORT } from './config/enviroment';
import { connectDB } from './database/connection';

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

startServer();
