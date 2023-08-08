import { DataTypes } from 'sequelize';
import { sequelize } from '../database';

/**
 * Modal for the communities being watched.
 */
export const Communities = sequelize.define(
  'communities',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
    createdAt: false,
    updatedAt: false,
  },
);
