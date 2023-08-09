import { Sequelize } from 'sequelize';
import { sequelize } from './sequelize';
import { Community, BannedSite, Link } from './modals';

/**
 * Sets up the database and returns a Sequelize instance.
 */
export const createDatabase = async (): Promise<Sequelize> => {
  await Community.sync({ alter: true });
  await BannedSite.sync({ alter: true });
  await Link.sync({ alter: true });

  return sequelize;
};
