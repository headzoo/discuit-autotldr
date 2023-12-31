import { DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

/**
 * Modal for the communities being watched.
 */
export const Community = sequelize.define(
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
