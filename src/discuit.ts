import { Discuit, Post } from '@headz/discuit';
import { logger } from './logger';

/**
 * Creates a new Discuit instance and logs in the bot.
 */
export const createDiscuit = async (): Promise<Discuit> => {
  if (!process.env.DISCUIT_USERNAME || !process.env.DISCUIT_PASSWORD) {
    logger.error('Missing DISCUIT_USERNAME or DISCUIT_PASSWORD');
    process.exit(1);
  }

  const discuit = new Discuit();
  const bot = await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);
  if (!bot) {
    logger.error('Failed to login');
    process.exit(1);
  }

  return discuit;
};
