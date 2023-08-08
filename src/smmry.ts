import smmry from 'smmry';
import { logger } from './logger';

/**
 * Creates a new Smmry instance.
 *
 * Summaries are created by https://smmry.com
 */
export const createSmmry = async (): Promise<smmry> => {
  if (!process.env.DISCUIT_SMMRY_KEY) {
    logger.error('Missing DISCUIT_SMMRY_KEY');
    process.exit(1);
  }

  return smmry({
    SM_API_KEY: process.env.DISCUIT_SMMRY_KEY,
    SM_LENGTH: 5,
    SM_WITH_BREAK: true,
  });
};
