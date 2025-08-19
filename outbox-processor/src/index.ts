import { database } from "./database/postgres";
import { queueService } from "./queue/redis";
import { PROCESSOR_INTERVAL, BATCH_SIZE } from "./config/enviroment";
import logger from "./config/logger";

class OutboxProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start() {
    logger.info("Iniciando Outbox Processor...");

    const pgHealthy = await database.healthCheck();
    const redisHealthy = await queueService.healthCheck();

    if (!pgHealthy || !redisHealthy) {
      logger.error("Health check falhou");
      process.exit(1);
    }

    logger.info("Outbox Processor iniciado com sucesso");
    logger.info(`Intervalo de processamento: ${PROCESSOR_INTERVAL}ms`);
    logger.info(`Tamanho do Batch: ${BATCH_SIZE}`);

    this.isRunning = true;
    this.scheduleNextRun();
  }

  private scheduleNextRun() {
    if (!this.isRunning) return;

    this.intervalId = setTimeout(async () => {
      try {
        await this.processEvents();
      } catch (error) {
        logger.error("Erro ao processar eventos", error);
      } finally {
        this.scheduleNextRun();
      }
    }, PROCESSOR_INTERVAL);
  }

  private async processEvents() {
    const events = await database.getUnprocessedEvents(BATCH_SIZE);

    for (const event of events) {
      logger.info("Processando eventos...");
      logger.info(`Encontrados ${events.length} eventos para processar`);
      try {
        await queueService.addConversionJob(event.event_data);

        const marked = await database.markEventProcessed(event.id);
        if (!marked) {
          logger.warn(`Evento ${event.id} não foi marcado como processado`);
        } else {
          logger.info(
            `Evento ${event.id} enviado para a fila e marcado como processado`,
          );
        }
      } catch (err: any) {
        logger.error(`Erro ao processar evento ${event.id}:`, err.message);
        await database.markEventFailed(event.id, err.message);
      }
    }
  }

  async stop() {
    logger.info("Parando Outbox Processor...");
    this.isRunning = false;

    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }

    await database.close();
    await queueService.close();
    logger.info("Outbox Processor parado com sucesso");
  }
}

const processor = new OutboxProcessor();

process.on("SIGTERM", async () => {
  await processor.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await processor.stop();
  process.exit(0);
});

processor.start().catch((error) => {
  logger.error("Erro ao iniciar o Outbox Processor:", error);
  process.exit(1);
});
