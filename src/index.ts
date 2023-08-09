import './config';
import { Communities, BannedSites } from './modals';
import { createDatabase } from './database';
import { runDiscuitWatch } from './discuit';
import { runAdminSite } from './server';

(async () => {
  await createDatabase();
  const communities: string[] = [];
  const bannedDomains: string[] = [];
  (await Communities.findAll()).forEach((community) => {
    communities.push(community.dataValues.name);
  });
  (await BannedSites.findAll()).forEach((site) => {
    bannedDomains.push(site.dataValues.hostname);
  });

  await runDiscuitWatch(communities, bannedDomains);
  await runAdminSite();
})();
