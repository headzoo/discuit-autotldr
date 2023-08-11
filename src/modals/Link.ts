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
      autoIncrement: true,
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
    commentId: {
      type: DataTypes.STRING,
    },
    title: {
      type: DataTypes.STRING,
    },
    markdown: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: true,
    createdAt: true,
    updatedAt: false,
  },
);
