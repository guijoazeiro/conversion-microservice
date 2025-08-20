import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const VERSION = process.env.npm_package_version || '1.0.0';
export const uploadDir = process.env.UPLOAD_DIR || '../tmp/input';
export const OUTPUT_DIR = process.env.OUTPUT_DIR || '../tmp/output';
export const PG_HOST = process.env.PG_HOST || 'postgres';
export const PG_PORT = Number(process.env.PG_PORT) || 5432;
export const PG_USER = process.env.PG_USER || 'postgres';
export const PG_PASSWORD = process.env.PG_PASSWORD || 'postgres123';
export const PG_DATABASE = process.env.PG_DATABASE || 'converter';
