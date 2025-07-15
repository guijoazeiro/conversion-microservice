import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const VERSION = process.env.npm_package_version || '1.0.0';
export const uploadDir = process.env.UPLOAD_DIR || './tmp/input';
