import './config';
import { Communities, BannedSites } from './modals';
import { runWatchLoop } from './discuit';
import { createDatabase } from './database';
import { listen } from './server';

(async () => {
  await createDatabase();

  // The communities that should be summarized.
  const communities: string[] = [];
  const c = await Communities.findAll();
  c.forEach((community) => {
    communities.push(community.dataValues.name);
  });

  // The domains that shouldn't be summarized because smmry breaks.
  const bannedDomains: string[] = [];
  const b = await BannedSites.findAll();
  b.forEach((site) => {
    bannedDomains.push(site.dataValues.hostname);
  });

  await runWatchLoop(communities, bannedDomains);
  listen();
})();
