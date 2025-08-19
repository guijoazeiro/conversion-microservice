import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { REDIS_URL } from "../config/enviroment";
import logger from "../config/logger";

const MAX_LIGHT_FILE_SIZE = 500 * 1024 * 1024;

const defaultConnection: Redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: false,
  connectTimeout: 10000,
  commandTimeout: 5000,
});

export default class QueueService {
  private lightQueue?: Queue;
  private heavyQueue?: Queue;

  constructor(private connection: Redis = defaultConnection) {
    this.connection = connection;

    this.connection.on("error", (error) => {
      logger.error("Erro na conexão com o Redis:", error);
    });

    this.connection.on("connect", () => {
      logger.info("Redis conectado");
    });

    this.connection.on("ready", () => {
      logger.info("Redis pronto");
    });
  }

  async addConversionJob(jobData: {
    id: string;
    format: string;
    input_path: string;
    mimetype: string;
    file_size: number;
    status: string;
    priority?: number;
  }) {
    const { file_size, priority = 0 } = jobData;

    if (file_size <= MAX_LIGHT_FILE_SIZE) {
      this.lightQueue = new Queue("light", { connection: this.connection });
      await this.lightQueue.add("convert", jobData, {
        priority,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      });
      logger.info(
        `Job ${jobData.id} adicionado a fila LIGHT ${this.formatFileSizeAuto(file_size)}`,
      );
    } else {
      this.heavyQueue = new Queue("heavy", { connection: this.connection });
      await this.heavyQueue.add("convert", jobData, {
        priority,
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 25,
        delay: this.calculateDelay(file_size),
      });
      logger.info(
        `Job ${jobData.id} adicionado a fila HEAVY ${this.formatFileSizeAuto(file_size)}`,
      );
    }
  }

  private calculateDelay(fileSize: number): number {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB > 500) return 60000;
    if (sizeInMB > 200) return 30000;
    if (sizeInMB > 50) return 10000;
    return 2000;
  }

  async calculatePriority(fileSize: number) {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB <= 1) return 15;
    if (sizeInMB <= 10) return 10;
    if (sizeInMB <= 50) return 7;
    if (sizeInMB <= 200) return 5;
    return 1;
  }

  async estimateProcessingTime(fileSize: number) {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB <= 10) return "30 segundos - 2 minutos";
    if (sizeInMB <= 50) return "1-5 minutos";
    if (sizeInMB <= 200) return "5-15 minutos";
    if (sizeInMB <= 500) return "15-45 minutos";
    return "45+ minutos";
  }

  async healthCheck() {
    try {
      await this.connection.ping();
      return true;
    } catch (error) {
      logger.error("Redis health check failed:", error);
      return false;
    }
  }
  formatFileSizeAuto(bytes: number) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async getQueueStatus() {
    try {
      const status: any = {};

      if (this.lightQueue) {
        const lightWaiting = await this.lightQueue.getWaiting();
        const lightActive = await this.lightQueue.getActive();
        const lightCompleted = await this.lightQueue.getCompleted();
        const lightFailed = await this.lightQueue.getFailed();

        status.light = {
          waiting: lightWaiting.length,
          active: lightActive.length,
          completed: lightCompleted.length,
          failed: lightFailed.length,
        };
      }

      if (this.heavyQueue) {
        const heavyWaiting = await this.heavyQueue.getWaiting();
        const heavyActive = await this.heavyQueue.getActive();
        const heavyCompleted = await this.heavyQueue.getCompleted();
        const heavyFailed = await this.heavyQueue.getFailed();

        status.heavy = {
          waiting: heavyWaiting.length,
          active: heavyActive.length,
          completed: heavyCompleted.length,
          failed: heavyFailed.length,
        };
      }

      return status;
    } catch (error) {
      logger.error("Error getting queue status:", error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.lightQueue) {
        await this.lightQueue.close();
      }
      if (this.heavyQueue) {
        await this.heavyQueue.close();
      }
      await this.connection.quit();
    } catch (error) {
      logger.error("Error closing connections:", error);
      this.connection.disconnect();
    }
  }
}

export const queueService = new QueueService();
