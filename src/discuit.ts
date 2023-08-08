import { Discuit } from '@headz/discuit';
import { Redis } from './redis';
import { RedisSeenChecker } from './RedisSeenChecker';
import { logger } from './logger';

/**
 * Creates a new Discuit instance and logs in the bot.
 */
export const createDiscuit = async (redis: Redis): Promise<Discuit> => {
  if (!process.env.DISCUIT_USERNAME || !process.env.DISCUIT_PASSWORD) {
    logger.error('Missing DISCUIT_USERNAME or DISCUIT_PASSWORD');
    process.exit(1);
  }

  const discuit = new Discuit();
  discuit.seenChecker = new RedisSeenChecker(redis);
  const bot = await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);
  if (!bot) {
    logger.error('Failed to login');
    process.exit(1);
  }

  return discuit;
};
