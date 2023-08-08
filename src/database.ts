import { Sequelize } from 'sequelize';
import { sequelize } from './sequelize';
import { Communities, BannedSites } from './modals';

/**
 * Sets up the database and returns a Sequelize instance.
 */
export const createDatabase = async (): Promise<Sequelize> => {
  await Communities.sync({ alter: true });
  await BannedSites.sync({ alter: true });

  return sequelize;
};
