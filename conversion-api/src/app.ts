import express from 'express';
import { VERSION } from './config/enviroment';
import { formatUptime } from './utils/formatUptime';
import convertRoutes from './routes/convert.routes';
import filesRoutes from './routes/files.routes';
import { OK_CODE } from './utils/constants';
import httpLogger from './config/httplogger';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();

app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));
app.use(httpLogger);

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API de Conversão - Documentação"
}));

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
