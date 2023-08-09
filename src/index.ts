import './config';
import { Communities, BannedSites } from './modals';
import { createDatabase } from './database';
import { runDiscuitWatch } from './discuit';
import { runAdminSite } from './server';

(async () => {
  await createDatabase();

  const communities: string[] = [];
  const c = await Communities.findAll();
  c.forEach((community) => {
    communities.push(community.dataValues.name);
  });

  const bannedDomains: string[] = [];
  const b = await BannedSites.findAll();
  b.forEach((site) => {
    bannedDomains.push(site.dataValues.hostname);
  });

  await runDiscuitWatch(communities, bannedDomains);
  await runAdminSite();
})();
