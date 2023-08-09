import dotenv from 'dotenv';

// Load environment variables from .env file, where API keys and passwords are configured.
// This call needs to come before other modules are imported.
dotenv.config({
  path: `${__dirname}/../.env`,
});
