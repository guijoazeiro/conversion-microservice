import { Queue, connection } from '../config/redis';

export const convertQueue = new Queue('convert', {
  connection,
});
