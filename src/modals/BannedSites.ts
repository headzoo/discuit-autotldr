import { DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

/**
 * Modal for sites that should be ignored because smmry breaks.
 */
export const BannedSites = sequelize.define(
  'banned_sites',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    hostname: {
      type: DataTypes.STRING,
    },
    reason: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
    createdAt: false,
    updatedAt: false,
  },
);
