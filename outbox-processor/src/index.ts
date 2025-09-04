import { database } from "./database/postgres";
import { queueService } from "./queue/redis";
import { PROCESSOR_INTERVAL, BATCH_SIZE } from "./config/enviroment";
import logger from "./config/logger";

class OutboxProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start() {
    logger.info("Starting Outbox Processor...");

    const pgHealthy = await database.healthCheck();
    const redisHealthy = await queueService.healthCheck();

    if (!pgHealthy || !redisHealthy) {
      logger.error("Health check falhou");
      process.exit(1);
    }

    logger.info("Outbox Processor started successfully");
    logger.info(`Processor Interval: ${PROCESSOR_INTERVAL}ms`);
    logger.info(`Batch Size: ${BATCH_SIZE}`);

    this.isRunning = true;
    this.scheduleNextRun();
  }

  private scheduleNextRun() {
    if (!this.isRunning) return;

    this.intervalId = setTimeout(async () => {
      try {
        await this.processEvents();
      } catch (error) {
        logger.error("Error processing events: ", error);
      } finally {
        this.scheduleNextRun();
      }
    }, PROCESSOR_INTERVAL);
  }

  private async processEvents() {
    const events = await database.getUnprocessedEvents(BATCH_SIZE);

    if (events.length === 0) {
      logger.debug("No events to process");
      return;
    }

    logger.info(`Processing ${events.length} events`);

    for (const event of events) {
      try {
        await queueService.addConversionJob(event.event_data);

        const taskQueued = await database.markTaskQueued(event.aggregate_id);
        if (!taskQueued) {
          logger.warn(
            `Task ${event.aggregate_id} was not marked as queued (may already have been processed)`,
          );
        }

        const eventProcessed = await database.markEventProcessed(event.id);
        if (!eventProcessed) {
          logger.warn(`Event ${event.id} was not marked as processed`);
        } else {
          logger.info(
            `Task ${event.aggregate_id} sent to the queue and marked as queued`,
          );
        }
      } catch (err: any) {
        logger.error(`Error processing event ${event.id}: ${err.message}`);
        await database.markEventFailed(event.id, err.message);
      }
    }
  }

  async stop() {
    logger.info("Stopping Outbox Processor...");
    this.isRunning = false;

    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }

    await database.close();
    await queueService.close();
    logger.info("Outbox Processor stopped successfully");
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
  logger.error("Error starting Outbox Processor: ", error);
  process.exit(1);
});
