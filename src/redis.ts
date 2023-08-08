import { createClient } from 'redis';
import { logger } from './logger';

/**
 * Redis to keep track of which posts have been already been summaried.
 */
export const createRedis = async (): Promise<ReturnType<typeof createClient>> => {
  const client = createClient();
  client.on('error', (err) => {
    logger.error(err.toString());
    process.exit(1);
  });
  await client.connect();

  return client;
};
