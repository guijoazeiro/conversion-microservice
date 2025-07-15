import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { REDIS_URL } from './enviroment';

const connection = new IORedis(REDIS_URL);

export { connection, Queue, Worker, QueueEvents };
