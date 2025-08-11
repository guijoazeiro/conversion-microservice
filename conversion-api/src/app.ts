import express from 'express';
import morgan from 'morgan';
import { VERSION } from './config/enviroment';
import { formatUptime } from './utils/formatUptime';
import convertRoutes from './routes/convert.routes';
import filesRoutes from './routes/files.routes';
import { OK_CODE } from './utils/constants';
import httpLogger from './config/httplogger';

const app = express();

app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));
app.use(httpLogger);

app.use('/api/convert', convertRoutes);
app.use('/api/file', filesRoutes);

app.get('/health', (req, res) => {
  res.status(OK_CODE).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(process.uptime()),
    version: VERSION,
  });
});

export default app;
