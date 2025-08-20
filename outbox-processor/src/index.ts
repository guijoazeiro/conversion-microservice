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

    if (events.length === 0) {
      logger.debug("Nenhum evento de conversão pendente encontrado");
      return;
    }

    logger.info(`Processando ${events.length} evento(s) de conversão...`);

    for (const event of events) {
      try {
        await queueService.addConversionJob(event.event_data);

        const taskQueued = await database.markTaskQueued(event.aggregate_id);
        if (!taskQueued) {
          logger.warn(
            `Tarefa ${event.aggregate_id} não foi marcada como queued (pode já ter sido processada)`,
          );
        }

        const eventProcessed = await database.markEventProcessed(event.id);
        if (!eventProcessed) {
          logger.warn(`Evento ${event.id} não foi marcado como processado`);
        } else {
          logger.info(
            `Tarefa ${event.aggregate_id} enviada para a fila e marcada como queued`,
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
