import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world!');
});

/**
 * Starts the admin web server.
 */
export const listen = () => {
  if (!process.env.DISCUIT_ADMIN_PORT) {
    console.error('Missing DISCUIT_ADMIN_PORT');
    process.exit(1);
  }

  app.listen(process.env.DISCUIT_ADMIN_PORT, () => {
    console.log(`Listening on port ${process.env.DISCUIT_ADMIN_PORT}`);
  });
};
