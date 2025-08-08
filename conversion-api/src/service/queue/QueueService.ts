import logger from '../../config/logger';
import { connection as defaultConnection, Queue } from '../../config/redis';

export default class QueueService {
  private lightQueue?: Queue;
  private heavyQueue?: Queue;

  constructor(private connection = defaultConnection) {
    this.connection = connection;
  }

  async addConversionJob(jobData: {
    id: string;
    path: string;
    mimetype: string;
    format: string;
    fileSize: number;
    status: string;
    priority?: number;
  }) {
    const { fileSize, priority = 0 } = jobData;

    if (fileSize <= 10 * 1024 * 1024) {
      this.lightQueue = new Queue('light', { connection: this.connection });
      await this.lightQueue.add('convert', jobData, {
        priority,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      logger.info(
        `Job ${jobData.id} adicionado a fila LIGHT ${fileSize} bytes`,
      );
    } else {
      this.heavyQueue = new Queue('heavy', { connection: this.connection });
      await this.heavyQueue.add('convert', jobData, {
        priority,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 25,
        delay: this.calculateDelay(fileSize),
      });

      logger.info(
        `Job ${jobData.id} adicionado a fila HEAVY ${fileSize} bytes`,
      );
    }
  }

  private calculateDelay(fileSize: number): number {
    const sizeInMB = fileSize / (1024 * 1024);

    if (sizeInMB > 500) return 30000;
    if (sizeInMB > 200) return 15000;
    return 5000;
  }

  async calculatePriority(fileSize: number) {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB <= 10) return 10;
    if (sizeInMB <= 100) return 5;
    return 1;
  }

  async estimateProcessingTime(fileSize: number) {
    const sizeInMB = fileSize / (1024 * 1024);

    if (sizeInMB <= 50) return '1-3 minutos';
    if (sizeInMB <= 200) return '3-10 minutos';
    if (sizeInMB <= 500) return '10-30 minutos';
    return '30+ minutos';
  }
}
