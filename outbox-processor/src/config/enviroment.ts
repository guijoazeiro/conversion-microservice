import dotenv from "dotenv";

dotenv.config();

export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const PG_HOST = process.env.POSTGRES_HOST || "postgres";
export const PG_PORT = Number(process.env.POSTGRES_PORT) || 5432;
export const PG_USER = process.env.POSTGRES_USER || "postgres";
export const PG_PASSWORD = process.env.POSTGRES_PASSWORD || "postgres123";
export const PG_DATABASE = process.env.POSTGRES_DB || "converter";
export const PROCESSOR_INTERVAL = parseInt(
  process.env.PROCESSOR_INTERVAL || "500",
);
export const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "10");
