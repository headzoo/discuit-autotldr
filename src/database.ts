import { Sequelize } from 'sequelize';
import { Communities, BannedSites } from './modals';
import { logger } from './logger';

/**
 * Sets up the database and returns a Sequelize instance.
 */
export const createDatabase = async (): Promise<Sequelize> => {
  if (
    !process.env.DISCUIT_DB_USER ||
    !process.env.DISCUIT_DB_PASSWORD ||
    !process.env.DISCUIT_DB_NAME ||
    !process.env.DISCUIT_DB_HOST
  ) {
    logger.error(
      'Missing DISCUIT_DB_USERNAME or DISCUIT_DB_PASSWORD or DISCUIT_DB_NAME or DISCUIT_DB_HOST',
    );
    process.exit(1);
  }

  const sequelize = new Sequelize(
    process.env.DISCUIT_DB_NAME,
    process.env.DISCUIT_DB_USER,
    process.env.DISCUIT_DB_PASSWORD,
    {
      host: process.env.DISCUIT_DB_HOST,
      dialect: 'mysql',
      logging: false,
    },
  );

  await Communities.sync({ alter: true });
  await BannedSites.sync({ alter: true });

  return sequelize;
};
