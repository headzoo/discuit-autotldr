import './config';
import { createDatabase } from './database';
import { runDiscuitWatch } from './discuit';
import { runAdminSite } from './server';

(async () => {
  await createDatabase();
  await runDiscuitWatch();
  await runAdminSite();
})();
