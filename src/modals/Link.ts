import { DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

/**
 * Modal for links created by the bot.
 */
export const Link = sequelize.define(
  'links',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING,
    },
    source: {
      type: DataTypes.STRING,
    },
    community: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    createdAt: true,
    updatedAt: false,
  },
);
