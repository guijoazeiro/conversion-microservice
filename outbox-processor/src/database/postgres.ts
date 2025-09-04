import { Pool } from "pg";
import {
  PG_DATABASE,
  PG_HOST,
  PG_PASSWORD,
  PG_PORT,
  PG_USER,
} from "../config/enviroment";
import logger from "../config/logger";

class PostgresDatabase {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: PG_HOST,
      port: PG_PORT,
      database: PG_DATABASE,
      user: PG_USER,
      password: PG_PASSWORD,
    });

    this.pool.on("error", (err) => {
      logger.error("Error connecting to database:", err);
    });
  }

  async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async getUnprocessedEvents(limit: number = 10) {
    const result = await this.query(
      "SELECT * FROM get_pending_conversion_events($1)",
      [limit],
    );
    return result.rows;
  }

  async markTaskQueued(taskId: string) {
    const result = await this.query("SELECT mark_task_queued($1) as success", [
      taskId,
    ]);
    return result.rows[0]?.success || false;
  }

  async getAllUnprocessedEvents(limit: number = 10) {
    const result = await this.query(
      "SELECT * FROM get_pending_outbox_events($1)",
      [limit],
    );
    return result.rows;
  }

  async markEventProcessed(eventId: string) {
    const result = await this.query(
      "SELECT mark_outbox_event_processed($1) as success",
      [eventId],
    );
    return result.rows[0]?.success || false;
  }

  async markEventFailed(eventId: string, errorMessage: string) {
    const result = await this.query(
      "SELECT mark_outbox_event_failed($1, $2) as success",
      [eventId, errorMessage],
    );
    return result.rows[0]?.success || false;
  }

  async healthCheck() {
    try {
      await this.query("SELECT 1");
      return true;
    } catch (error) {
      logger.error("Health check do PostgreSQL falhou:", error);
      return false;
    }
  }

  async close() {
    await this.pool.end();
  }
}

export const database = new PostgresDatabase();
