import winston from 'winston';

/**
 * The app logger.
 */
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  defaultMeta: { service: 'discuit' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: `${__dirname}/../logs/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${__dirname}/../logs/combined.log` }),
  ],
});

export { logger };
